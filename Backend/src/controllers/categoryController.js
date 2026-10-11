// Express 5 natively handles async errors — asyncHandler is not needed
const Category = require('../models/Category');
const Product = require('../models/Product');
const { deleteFilesInFolder, resolveImageKitFolder } = require('../utils/imagekitHelpers');

// @desc    Get all categories (nested format)
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    let query = {};
    if (req.query.keyword) {
        query = {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } },
                { slug: { $regex: req.query.keyword, $options: 'i' } }
            ]
        };
    }
    const categories = await Category.find(query);
    res.json(categories);
};

// @desc    Get a single category
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (category) {
        res.json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    const { name, slug, description, image, subCategories, isActive } = req.body;

    const generatedSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    const categoryExists = await Category.findOne({ $or: [{ name }, { slug: generatedSlug }] });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category with this name or slug already exists');
    }

    const category = new Category({
        name,
        slug: generatedSlug,
        description,
        image,
        isActive: isActive !== undefined ? isActive : true,
        subCategories: subCategories || []
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    const { name, slug, description, image, subCategories, isActive, renameMap } = req.body;

    const category = await Category.findById(req.params.id);

    if (category) {
        const oldCategoryName = category.name;
        const oldSubCategories = category.subCategories ? [...category.subCategories] : [];

        category.name = name || category.name;
        category.slug = slug || category.slug;
        category.description = description !== undefined ? description : category.description;
        category.image = image !== undefined ? image : category.image;
        category.isActive = isActive !== undefined ? isActive : category.isActive;
        category.subCategories = subCategories !== undefined ? subCategories : category.subCategories;

        const updatedCategory = await category.save();

        const targetCategory = (name && name.trim()) || oldCategoryName;

        // 1. Cascade main category rename to existing products if changed
        if (name && name.trim() && name.trim() !== oldCategoryName) {
            try {
                await Product.updateMany(
                    { category: oldCategoryName },
                    { $set: { category: name.trim() } }
                );
            } catch (err) {
                console.error('Failed to cascade main category rename to products:', err);
            }
        }

        // 2. Cascade subcategory renames via explicit renameMap
        if (renameMap) {
            if (Array.isArray(renameMap.subCategories)) {
                for (const item of renameMap.subCategories) {
                    if (item.oldName && item.newName && item.oldName.trim() !== item.newName.trim()) {
                        try {
                            await Product.updateMany(
                                {
                                    $or: [
                                        { category: oldCategoryName, subCategory: item.oldName.trim() },
                                        { category: targetCategory, subCategory: item.oldName.trim() }
                                    ]
                                },
                                { $set: { subCategory: item.newName.trim() } }
                            );
                        } catch (err) {
                            console.error(`Failed to cascade subCategory rename "${item.oldName}" -> "${item.newName}":`, err);
                        }
                    }
                }
            }

            if (Array.isArray(renameMap.subSubCategories)) {
                for (const item of renameMap.subSubCategories) {
                    if (item.oldName && item.newName && item.oldName.trim() !== item.newName.trim()) {
                        try {
                            const query = {
                                $or: [
                                    { category: oldCategoryName, subSubCategory: item.oldName.trim() },
                                    { category: targetCategory, subSubCategory: item.oldName.trim() }
                                ]
                            };
                            if (item.subCategory) {
                                query.subCategory = item.subCategory;
                            }
                            await Product.updateMany(
                                query,
                                { $set: { subSubCategory: item.newName.trim() } }
                            );
                        } catch (err) {
                            console.error(`Failed to cascade subSubCategory rename "${item.oldName}" -> "${item.newName}":`, err);
                        }
                    }
                }
            }
        }

        // 3. Auto-detect subcategory rename via _id comparison as fallback
        if (Array.isArray(subCategories) && oldSubCategories.length > 0) {
            for (const newSub of subCategories) {
                if (newSub && newSub._id) {
                    const matchOld = oldSubCategories.find(s => s._id && s._id.toString() === newSub._id.toString());
                    if (matchOld && matchOld.name && newSub.name && matchOld.name.trim() !== newSub.name.trim()) {
                        try {
                            await Product.updateMany(
                                {
                                    $or: [
                                        { category: oldCategoryName, subCategory: matchOld.name.trim() },
                                        { category: targetCategory, subCategory: matchOld.name.trim() }
                                    ]
                                },
                                { $set: { subCategory: newSub.name.trim() } }
                            );
                        } catch (err) {
                            console.error(`Failed to cascade subCategory rename via _id "${matchOld.name}" -> "${newSub.name}":`, err);
                        }
                    }
                }
            }
        }

        res.json(updatedCategory);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (category) {
        // Remove the category's ImageKit images (stored under /ecommerce-drone/categories/<CategoryName>)
        try {
            const folder = resolveImageKitFolder('category', category.name);
            const removed = await deleteFilesInFolder(folder);
            if (removed > 0) {
                console.log(`[ImageKit] Cleaned up ${removed} file(s) for category ${category.name}`);
            }
        } catch (err) {
            console.error('[ImageKit] Failed to clean up category images:', err.message);
        }

        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
