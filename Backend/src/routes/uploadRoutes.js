const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    resolveImageKitFolder,
    extensionForMime,
    sanitizeSegment,
    deleteFilesInFolder,
    deleteFileByName,
    deleteFileByUrl,
} = require('../utils/imagekitHelpers');
const imagekit = require('../config/imagekit');
const { protect, admin } = require('../middleware/authMiddleware');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// Memory storage + strict validation: only image files, max 5 MB each.
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
//   image       <file>                                  required
//   context     'product' | 'category' | 'banner' | 'homebanner' | 'cms' | 'service'  (default: 'banner')
//   folderPath  e.g. a product SKU, a service title, or 'Category/SubCategory/SubSubCategory'
//   name        optional — file name prefix (without extension)
//   oldImageUrl optional — previous image URL to delete from ImageKit before replacing
//   index       sequence number used for image-<index>.<ext> (default: 1)
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
    }

    try {
        const context = String(req.body.context || 'homebanner').toLowerCase();
        const folder = resolveImageKitFolder(context, String(req.body.folderPath || ''));
        const index = Math.max(1, parseInt(req.body.index, 10) || 1);
        const ext = extensionForMime(req.file.mimetype, req.file.originalname);
        const name = String(req.body.name || '').trim();
        const oldImageUrl = String(req.body.oldImageUrl || '').trim();

        // If an old image URL was provided for replacement, delete it from ImageKit
        if (oldImageUrl) {
            await deleteFileByUrl(oldImageUrl);
        }

        let baseName = '';
        if (name) {
            baseName = sanitizeSegment(name);
        } else if (context === 'homebanner' || context === 'banner') {
            baseName = `homebanner-image${index}`;
        } else if (context === 'logo') {
            baseName = 'logo-image';
        } else {
            baseName = `image-${index}`;
        }

        // For banners and CMS images, delete any existing files matching this base name in the folder
        // to prevent older extension variations (e.g. .png vs .jpg) from remaining
        if (context === 'homebanner' || context === 'banner' || context === 'cms' || context === 'logo') {
            try {
                const existing = await imagekit.listFiles({ path: folder, limit: 50 });
                if (existing && existing.length > 0) {
                    for (const f of existing) {
                        if (f.name && f.name.startsWith(baseName)) {
                            await imagekit.deleteFile(f.fileId);
                        }
                    }
                }
            } catch (cleanupErr) {
                console.warn('[ImageKit] Warning cleaning previous banner file:', cleanupErr.message);
            }
        }

        // Append a timestamp so URL is always fresh and never served stale by CDN / browser caches
        const fileName = `${baseName}-${Date.now()}.${ext}`;

        const response = await imagekit.upload({
            file: req.file.buffer, // required
            fileName, // unique cache-busted filename
            folder, // e.g. /ecommerce-drone/homebanner
            useUniqueFileName: false,
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

// @desc    Delete every image stored under a structured folder, by name, or by URL
// @route   DELETE /api/upload?url=<imageUrl>
//          DELETE /api/upload?context=product&folderPath=<SKU>
//          DELETE /api/upload?context=category&folderPath=<CategoryName>[/<Sub>][/<SubSub>]
// @access  Private/Admin
router.delete('/', protect, admin, async (req, res) => {
    try {
        const url = String(req.query.url || '').trim();
        if (url) {
            const removed = await deleteFileByUrl(url);
            return res.json({ removed, url });
        }

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
