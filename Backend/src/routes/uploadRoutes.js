const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    resolveImageKitFolder,
    extensionForMime,
    sanitizeSegment,
    deleteFilesInFolder,
    deleteFileByName,
} = require('../utils/imagekitHelpers');
const imagekit = require('../config/imagekit');
const { protect, admin } = require('../middleware/authMiddleware');

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

// Memory storage + strict validation: only image files, max 2 MB each.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            const error = new Error('Only image files are allowed (JPG, PNG, WEBP, etc.)');
            error.status = 400;
            cb(error);
        }
    },
});

// @desc    Upload an image into a structured ImageKit folder
// @route   POST /api/upload
// @access  Private/Admin
// Multipart fields:
//   image     <file>                                  required
//   context   'product' | 'category' | 'banner' | 'cms' | 'service'  (default: 'banner')
//   folderPath e.g. a product SKU, a service title, or 'Category/SubCategory/SubSubCategory'
//   name      optional — file name (without extension). When provided the file is
//             saved as <name>.<ext> instead of image-<index>.<ext>. Used for
//             service backgrounds so the image is named after the service.
//   index     sequence number used for image-<index>.<ext> (default: 1)
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
    }

    try {
        const context = String(req.body.context || 'banner').toLowerCase();
        const folder = resolveImageKitFolder(context, String(req.body.folderPath || ''));
        const index = Math.max(1, parseInt(req.body.index, 10) || 1);
        const ext = extensionForMime(req.file.mimetype, req.file.originalname);
        const name = String(req.body.name || '').trim();
        const fileName = name ? `${sanitizeSegment(name)}.${ext}` : `image-${index}.${ext}`;

        const response = await imagekit.upload({
            file: req.file.buffer, // required
            fileName, // required — structured name (image-1.jpg, image-2.jpg, ...)
            folder, // e.g. /ecommerce-drone/products/<SKU>
            useUniqueFileName: false, // keep the exact name so re-uploading image-1 overwrites it
        });

        res.status(201).json({
            url: response.url,
            fileId: response.fileId,
            folder,
            fileName,
        });
    } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error('Image upload failed');
    }
});

// @desc    Delete every image stored under a structured folder
// @route   DELETE /api/upload?context=product&folderPath=<SKU>
//          DELETE /api/upload?context=category&folderPath=<CategoryName>[/<Sub>][/<SubSub>]
// @access  Private/Admin
router.delete('/', protect, admin, async (req, res) => {
    try {
        const context = String(req.query.context || 'banner').toLowerCase();
        const folder = resolveImageKitFolder(context, String(req.query.folderPath || ''));
        const name = String(req.query.name || '').trim();
        const removed = name
            ? await deleteFileByName(folder, name)
            : await deleteFilesInFolder(folder);
        res.json({ removed, folder, name: name || null });
    } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error('Cleanup of image files failed');
    }
});

module.exports = router;
