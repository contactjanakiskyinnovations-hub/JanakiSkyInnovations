// Express 5 natively handles async errors — asyncHandler is not needed
const Product = require('../models/Product');
const HomeSettings = require('../models/HomeSettings');
const Order = require('../models/Order');
const { deleteFilesInFolder, resolveImageKitFolder } = require('../utils/imagekitHelpers');

const normalizeComparisonTable = (comparisonTable) => {
    if (comparisonTable === undefined) return undefined;

    return {
        ...comparisonTable,
        rows: (comparisonTable.rows || [])
            .filter(row => row.feature?.trim())
            .map(row => ({
                feature: row.feature.trim(),
                selectedProductValue: row.selectedProductValue || '',
                comparisonProductOneValue: row.comparisonProductOneValue || '',
                comparisonProductTwoValue: row.comparisonProductTwoValue || '',
            })),
    };
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    // Pagination parameters
    const page = Number(req.query.pageNumber) || 1;
    const pageSize = Number(req.query.limit) || 12;

    // Search filter
    let query = {};
    
    if (req.query.keyword) {
        query = {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { sku: { $regex: req.query.keyword, $options: 'i' } },
                { brand: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } }
            ]
        };
    }

    // Category, Subcategory, and SubSubcategory filters (Hyphen & Space Agnostic, Case Insensitive)
    const filterConditions = [];
    if (req.query.category) {
        const rawCat = req.query.category.trim();
        const lowerCat = rawCat.toLowerCase();
        
        // Build flexible regexes matching both hyphenated slugs ("surveillance-drones") and spaced names ("Surveillance Drones")
        const catPattern = rawCat.replace(/[-_]/g, '[-_\\s]+');
        const catExactRegex = new RegExp(`^${catPattern}$`, 'i');
        const catContainsRegex = new RegExp(rawCat.replace(/[-_]/g, '[-_\\s]*'), 'i');
        
        // Also derive base word if category ends in -drones or drones (e.g. "surveillance-drones" -> "surveillance")
        const baseWord = rawCat.replace(/[-_\s]*drones$/i, '').trim();
        const baseWordRegex = baseWord ? new RegExp(`^${baseWord}$`, 'i') : null;

        if (lowerCat === 'drones' || lowerCat === 'drones products' || lowerCat === 'drones-products') {
            filterConditions.push({ 
                $or: [
                    { category: { $regex: /^drones/i } }, 
                    { category: { $regex: /drones products/i } },
                    { subCategory: { $regex: /drones/i } }
                ] 
            });
        } else if (lowerCat === 'accessories' || lowerCat === 'drones accessories and other electronic accessories' || lowerCat === 'drones-accessories-and-other-electronic-accessories') {
            filterConditions.push({ 
                $or: [
                    { category: { $regex: /^accessories/i } }, 
                    { category: { $regex: /drones accessories/i } },
                    { subCategory: { $regex: /accessories/i } }
                ] 
            });
        } else {
            const catOrConditions = [
                { category: catExactRegex },
                { category: catContainsRegex },
                { subCategory: catExactRegex },
                { subCategory: catContainsRegex },
                { subSubCategory: catExactRegex },
                { subSubCategory: catContainsRegex }
            ];

            if (baseWordRegex) {
                catOrConditions.push(
                    { category: baseWordRegex },
                    { subCategory: baseWordRegex },
                    { subSubCategory: baseWordRegex }
                );
            }

            // Compound slug parsing for hierarchical URLs (e.g. "dji-mini" -> subCategory: DJI, subSubCategory: Mini)
            const catWords = rawCat.split(/[-_\s]+/);
            if (catWords.length > 1) {
                const firstWord = catWords[0];
                const remainingWords = catWords.slice(1).join('[-_\\s]*');

                catOrConditions.push({
                    $and: [
                        { subCategory: new RegExp(`^${firstWord}`, 'i') },
                        { subSubCategory: new RegExp(`^${remainingWords}`, 'i') }
                    ]
                });

                catOrConditions.push({
                    $and: [
                        { category: new RegExp(`^${firstWord}`, 'i') },
                        { subCategory: new RegExp(`^${remainingWords}`, 'i') }
                    ]
                });
            }

            filterConditions.push({ $or: catOrConditions });
        }
    }
    if (req.query.subCategory) {
        const rawSub = req.query.subCategory.trim();
        const subPattern = rawSub.replace(/[-_]/g, '[-_\\s]+');
        filterConditions.push({ 
            $or: [
                { subCategory: new RegExp(`^${subPattern}$`, 'i') },
                { subCategory: new RegExp(rawSub.replace(/[-_]/g, '[-_\\s]*'), 'i') }
            ]
        });
    }
    if (req.query.subSubCategory) {
        const rawSubSub = req.query.subSubCategory.trim();
        const subSubPattern = rawSubSub.replace(/[-_]/g, '[-_\\s]+');
        filterConditions.push({ 
            $or: [
                { subSubCategory: new RegExp(`^${subSubPattern}$`, 'i') },
                { subSubCategory: new RegExp(rawSubSub.replace(/[-_]/g, '[-_\\s]*'), 'i') }
            ]
        });
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        const priceFilter = {};
        if (req.query.minPrice !== undefined && req.query.minPrice !== '') priceFilter.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') priceFilter.$lte = Number(req.query.maxPrice);
        filterConditions.push({ price: priceFilter });
    }

    // Rating filter
    if (req.query.minRating) {
        filterConditions.push({ ratings: { $gte: Number(req.query.minRating) } });
    }

    // Name filter
    if (req.query.name) {
        filterConditions.push({ name: { $regex: req.query.name, $options: 'i' } });
    }

    if (filterConditions.length > 0) {
        query.$and = filterConditions;
    }

    // Dynamic boolean filters
    if (req.query.isFeatured === 'true') {
        query.isFeatured = true;
    }

    if (req.query.collection === 'new-arrivals') {
        const settings = await HomeSettings.findOne().select('newArrivalDays');
        const newArrivalDays = settings?.newArrivalDays || 30;
        const newArrivalCutoff = new Date();
        newArrivalCutoff.setDate(newArrivalCutoff.getDate() - newArrivalDays);
        filterConditions.push({ $or: [
            { forceNewArrival: true },
            { createdAt: { $gte: newArrivalCutoff } }
        ] });
    }

    if (req.query.collection === 'best-sellers') {
        const settings = await HomeSettings.findOne().select('bestSellerThreshold');
        const bestSellerThreshold = settings?.bestSellerThreshold || 10;
        filterConditions.push({ $or: [
            { forceBestSeller: true },
            { salesCount: { $gte: bestSellerThreshold } }
        ] });
    }

    if (filterConditions.length > 0) {
        query.$and = filterConditions;
    }

    // Sorting
    let sortOptions = {};
    const sortVal = req.query.sortBy || req.query.sort;
    if (sortVal === 'price-asc' || sortVal === 'price_asc') {
        sortOptions = { price: 1 };
    } else if (sortVal === 'price-desc' || sortVal === 'price_desc') {
        sortOptions = { price: -1 };
    } else if (sortVal === 'name-asc' || sortVal === 'name_asc') {
        sortOptions = { name: 1 };
    } else if (sortVal === 'name-desc' || sortVal === 'name_desc') {
        sortOptions = { name: -1 };
    } else if (sortVal === 'best-sellers') {
        sortOptions = { forceBestSeller: -1, salesCount: -1, createdAt: -1 };
    } else if (sortVal === 'rating' || sortVal === 'top_rated' || sortVal === 'rating_desc') {
        sortOptions = { ratings: -1 };
    } else if (sortVal === 'newest') {
        sortOptions = { createdAt: -1 };
    } else {
        // default sort by latest
        sortOptions = { createdAt: -1 };
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort(sortOptions)
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ 
        products, 
        page, 
        pages: Math.ceil(count / pageSize),
        total: count
    });
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category', 'name slug hierarchyLevel');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

// @desc    Compare selected products using their saved specifications
// @route   GET /api/products/compare?ids=id1,id2,id3
// @access  Public
const compareProducts = async (req, res) => {
    const productIds = (req.query.ids || '')
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

    if (productIds.length < 2 || productIds.length > 4 || productIds.some(id => !require('mongoose').isValidObjectId(id))) {
        res.status(400);
        throw new Error('Provide between two and four valid product IDs');
    }

    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
        res.status(404);
        throw new Error('One or more products could not be found');
    }

    const productsById = new Map(products.map(product => [product._id.toString(), product]));
    const orderedProducts = productIds.map(id => productsById.get(id));
    const featureNames = new Set(['Category']);

    orderedProducts.forEach(product => {
        product.specifications?.forEach((value, key) => featureNames.add(key));
    });

    const comparisons = Array.from(featureNames).map(feature => ({
        feature,
        values: orderedProducts.map(product =>
            feature === 'Category' ? product.category : product.specifications?.get(feature) || '—'
        ),
    }));

    res.json({
        products: orderedProducts.map(product => ({
            _id: product._id,
            name: product.name,
            sku: product.sku,
            mainImage: product.mainImage,
            comparisonGroup: product.comparisonGroup,
        })),
        comparisons,
    });
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    const {
        name,
        sku,
        price,
        discountPrice,
        oldPrice,
        description,
        shortSummary,
        images,
        category,
        subCategory,
        subSubCategory,
        brand,
        stock,
        technicalSpecs,
        specifications,
        comparisonGroup,
        comparisonTable,
        howToUse,
        assemblyMaintenance,
        inTheBox,
        keyFeatures
    } = req.body;

    const product = new Product({
        name,
        sku,
        price,
        discountPrice,
        oldPrice: oldPrice !== undefined
            ? oldPrice
            : discountPrice > 0 && discountPrice < price ? price : undefined,
        description,
        shortSummary: shortSummary || '',
        gallery: images || [],
        mainImage: images && images[0] ? images[0] : 'https://images.unsplash.com/photo-1473968512467-3e9c02c0a7e5',
        category,
        subCategory: subCategory || 'tools',
        subSubCategory: subSubCategory || '',
        brand,
        stock,
        specifications: technicalSpecs || specifications,
        comparisonGroup: comparisonGroup || '',
        comparisonTable: normalizeComparisonTable(comparisonTable),
        howToUse: howToUse || '',
        assemblyMaintenance: assemblyMaintenance || '',
        inTheBox: inTheBox || '',
        keyFeatures: keyFeatures || ''
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const {
        name,
        sku,
        price,
        discountPrice,
        oldPrice,
        description,
        shortSummary,
        images,
        category,
        subCategory,
        subSubCategory,
        brand,
        stock,
        technicalSpecs,
        specifications,
        comparisonGroup,
        comparisonTable,
        howToUse,
        assemblyMaintenance,
        inTheBox,
        keyFeatures
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.sku = sku || product.sku;
        product.price = price || product.price;
        product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
        if (oldPrice !== undefined) {
            product.oldPrice = oldPrice;
        } else if (price !== undefined || discountPrice !== undefined) {
            product.oldPrice = product.discountPrice > 0 && product.discountPrice < product.price
                ? product.price
                : undefined;
        }
        product.description = description || product.description;
        product.shortSummary = shortSummary !== undefined ? shortSummary : product.shortSummary;
        product.gallery = images || product.gallery;
        if (images && images[0]) {
            product.mainImage = images[0];
        }
        product.category = category || product.category;
        product.subCategory = subCategory || product.subCategory;
        product.subSubCategory = subSubCategory !== undefined ? subSubCategory : product.subSubCategory;
        product.brand = brand || product.brand;
        product.stock = stock !== undefined ? stock : product.stock;
        product.specifications = technicalSpecs || specifications || product.specifications;
        product.comparisonGroup = comparisonGroup !== undefined ? comparisonGroup : product.comparisonGroup;
        product.comparisonTable = comparisonTable !== undefined
            ? normalizeComparisonTable(comparisonTable)
            : product.comparisonTable;
        product.howToUse = howToUse !== undefined ? howToUse : product.howToUse;
        product.assemblyMaintenance = assemblyMaintenance !== undefined ? assemblyMaintenance : product.assemblyMaintenance;
        product.inTheBox = inTheBox !== undefined ? inTheBox : product.inTheBox;
        product.keyFeatures = keyFeatures !== undefined ? keyFeatures : product.keyFeatures;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        // Remove the product's ImageKit images (stored under /ecommerce-drone/products/<SKU>)
        try {
            const folder = resolveImageKitFolder('product', product.sku);
            const removed = await deleteFilesInFolder(folder);
            if (removed > 0) {
                console.log(`[ImageKit] Cleaned up ${removed} file(s) for product SKU ${product.sku}`);
            }
        } catch (err) {
            console.error('[ImageKit] Failed to clean up product images:', err.message);
        }

        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
};

// @desc    Get related/recommended products (smart scoring engine)
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 4, 1), 24);

    // Fetch a broad candidate pool (up to 40 products, excluding current)
    let candidates = await Product.find({ _id: { $ne: product._id } }).limit(40);

    // --- Scoring Engine ---
    // Each candidate earns points based on multiple signals. Higher = more similar.
    const priceMin = product.price * 0.70;  // ±30% price range
    const priceMax = product.price * 1.30;

    const nameKeywords = product.name
        .toLowerCase()
        .split(/[\s\-,]+/)
        .filter(w => w.length > 2);     // meaningful words from product name

    const scored = candidates.map(candidate => {
        let score = 0;

        // Signal 1: Exact subCategory match (strongest signal, +40 pts)
        if (
            product.subCategory &&
            candidate.subCategory &&
            candidate.subCategory.toLowerCase() === product.subCategory.toLowerCase()
        ) {
            score += 40;
        }

        // Signal 2: Same brand (very strong, +30 pts)
        if (
            product.brand &&
            candidate.brand &&
            candidate.brand.toLowerCase() === product.brand.toLowerCase()
        ) {
            score += 30;
        }

        // Signal 3: Price range within ±30% (+20 pts)
        if (candidate.price >= priceMin && candidate.price <= priceMax) {
            score += 20;
        }

        // Signal 4: Category match (+15 pts)
        if (
            product.category &&
            candidate.category &&
            candidate.category.toString().toLowerCase() === product.category.toString().toLowerCase()
        ) {
            score += 15;
        }

        // Signal 5: Name keyword overlap (+5 pts per matching keyword, max +20)
        if (nameKeywords.length > 0) {
            const candidateName = candidate.name.toLowerCase();
            let keywordHits = 0;
            for (const kw of nameKeywords) {
                if (candidateName.includes(kw)) keywordHits++;
            }
            score += Math.min(keywordHits * 5, 20);
        }

        // Signal 6: Featured products get a small boost (+5 pts)
        if (candidate.isFeatured) score += 5;

        return { candidate, score };
    });

    // Sort by score descending, then pick the requested number of products
    scored.sort((a, b) => b.score - a.score);
    const recommended = scored.slice(0, limit).map(s => s.candidate);

    res.json(recommended);
};

// @desc    Update manual product promotion flags
// @route   PUT /api/products/:id/promotions
// @access  Private/Admin
const updateProductPromotions = async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    if (req.body.forceNewArrival !== undefined) product.forceNewArrival = Boolean(req.body.forceNewArrival);
    if (req.body.forceBestSeller !== undefined) product.forceBestSeller = Boolean(req.body.forceBestSeller);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
};

// @desc    Get product promotion settings
// @route   GET /api/products/promotion-settings
// @access  Private/Admin
const getPromotionSettings = async (req, res) => {
    const settings = await HomeSettings.findOne().select('bestSellerThreshold newArrivalDays');
    res.json({
        bestSellerThreshold: settings?.bestSellerThreshold || 10,
        newArrivalDays: settings?.newArrivalDays || 30,
    });
};

// @desc    Update product promotion settings
// @route   PUT /api/products/promotion-settings
// @access  Private/Admin
const updatePromotionSettings = async (req, res) => {
    const hasBestSellerThreshold = req.body.bestSellerThreshold !== undefined;
    const hasNewArrivalDays = req.body.newArrivalDays !== undefined;
    const bestSellerThreshold = Number(req.body.bestSellerThreshold);
    const newArrivalDays = Number(req.body.newArrivalDays);

    if (!hasBestSellerThreshold && !hasNewArrivalDays) {
        res.status(400);
        throw new Error('Provide a promotion setting to update');
    }
    if (hasBestSellerThreshold && (!Number.isInteger(bestSellerThreshold) || bestSellerThreshold < 1)) {
        res.status(400);
        throw new Error('Best-seller threshold must be a whole number of at least 1');
    }
    if (hasNewArrivalDays && (!Number.isInteger(newArrivalDays) || newArrivalDays < 1)) {
        res.status(400);
        throw new Error('New Arrival days must be a whole number of at least 1');
    }

    const settings = await HomeSettings.findOne() || new HomeSettings();
    if (hasBestSellerThreshold) settings.bestSellerThreshold = bestSellerThreshold;
    if (hasNewArrivalDays) settings.newArrivalDays = newArrivalDays;
    await settings.save();
    res.json({
        bestSellerThreshold: settings.bestSellerThreshold,
        newArrivalDays: settings.newArrivalDays,
    });
};

// @desc    Add or update a customer's rating for a product
// @route   POST /api/products/:id/reviews
// @access  Private (only customers whose order containing this product was Delivered)
const addProductReview = async (req, res) => {
    const { rating, comment, orderId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
        res.status(400);
        throw new Error('Rating must be a whole number between 1 and 5');
    }

    // Only customers whose order containing this product has been Delivered may rate it.
    const orderQuery = {
        user: req.user._id,
        isDelivered: true,
        'orderItems.product': req.params.id,
    };
    if (orderId) orderQuery._id = orderId;
    const order = await Order.findOne(orderQuery).sort({ createdAt: -1 });
    if (!order) {
        res.status(403);
        throw new Error('You can rate this product only after your order is delivered');
    }

    // Upsert this customer's review (re-ratings update instead of duplicating).
    const existing = product.reviews.find(r => String(r.user) === String(req.user._id));
    if (existing) {
        existing.rating = value;
        existing.comment = comment ? String(comment) : existing.comment;
    } else {
        product.reviews.push({
            user: req.user._id,
            name: req.user.name || 'Customer',
            rating: value,
            comment: comment ? String(comment) : '',
        });
    }

    // Recalculate the aggregate rating in real time so product cards/listing update immediately.
    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.numReviews = product.reviews.length;
    product.ratings = product.numReviews ? Number((total / product.numReviews).toFixed(1)) : 0;

    await product.save();

    // Mark the matching line item in the customer's delivered order as reviewed
    // so the frontend shows a "rated" confirmation instead of asking again.
    await Order.updateOne(
        { _id: order._id, 'orderItems.product': product._id },
        { $set: { 'orderItems.$.reviewed': true } }
    );

    res.status(201).json(product);
};

// @desc    Admin toggles whether a review's comment is visible (the rating is kept)
// @route   PUT /api/products/:id/reviews/:reviewId
// @access  Private/Admin
const updateReviewVisibility = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    const review = product.reviews.id(req.params.reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }
    review.isVisible = req.body.visible !== undefined ? Boolean(req.body.visible) : !review.isVisible;
    await product.save();
    res.json(product);
};

// @desc    Admin deletes a review (rating is recalculated)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
const deleteReview = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }
    const review = product.reviews.id(req.params.reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }
    review.deleteOne();
    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.numReviews = product.reviews.length;
    product.ratings = product.numReviews ? Number((total / product.numReviews).toFixed(1)) : 0;
    await product.save();
    res.json(product);
};

// @desc    Admin toggle forcePreOrder on/off (like forceNewArrival/forceBestSeller)
// @route   PUT /api/products/:id/pre-order
// @access  Private/Admin
const toggleProductPreOrder = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        product.forcePreOrder = !product.forcePreOrder;
        const updatedProduct = await product.save();
        res.json({
            forcePreOrder: updatedProduct.forcePreOrder,
            message: `Pre-order mode ${updatedProduct.forcePreOrder ? 'enabled' : 'disabled'}`
        });
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

module.exports = {
    updateReviewVisibility,
    deleteReview,
    addProductReview,
    getProducts,
    getProductById,
    compareProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
    updateProductPromotions,
    toggleProductPreOrder,
    getPromotionSettings,
    updatePromotionSettings,
};
