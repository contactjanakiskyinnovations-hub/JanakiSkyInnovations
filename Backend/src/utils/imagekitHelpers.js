// ImageKit helpers: structured folder resolution + folder cleanup.
// Used by the upload API (POST / DELETE /api/upload) and by product/category
// deletion so images stored on ImageKit are removed when the DB record goes away.

const imagekit = require('../config/imagekit');

// Make a single path segment safe for an ImageKit folder / file name.
const sanitizeSegment = (value) => {
    return String(value || '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^[.-]+|[.-]+$/g, '')
        .slice(0, 60) || 'item';
};

// Build the absolute ImageKit folder for a given context + raw path segments.
//   product  -> /ecommerce-drone/products/<SKU>
//   category -> /ecommerce-drone/categories/<CategoryName>[/<SubCategory>][/<SubSubCategory>]
//   banner   -> /ecommerce-drone/banners
//   cms      -> /ecommerce-drone/cms/<folderPath>
//   service  -> /ecommerce-drone/services/<ServiceName>  (per-service folder,
//               image file itself is named after the service title)
//   any other context -> /ecommerce-drone/uploads
const resolveImageKitFolder = (context, rawSegments) => {
    const segments = String(rawSegments || '')
        .split('/')
        .map(sanitizeSegment)
        .filter(Boolean);

    if (context === 'product') {
        return `/${['ecommerce-drone', 'products', segments[0] || 'sku-default'].join('/')}`;
    }
    if (context === 'category') {
        return `/${['ecommerce-drone', 'categories', ...segments.slice(0, 3)].join('/')}`;
    }
    if (context === 'banner' || context === 'homebanner') {
        return '/ecommerce-drone/homebanner';
    }
    if (context === 'logo') {
        return '/ecommerce-drone/logo';
    }
    if (context === 'cms') {
        // CMS-managed images (e.g. category banners) use a dedicated, segment-scoped
        // folder so they never collide with product/category media or hero/promo banners.
        return `/ecommerce-drone/cms/${segments.length ? segments.join('/') : 'uploads'}`;
    }
    if (context === 'service') {
        // Each service gets its own folder inside /services so re-uploading the
        // same service overwrites its image instead of stacking duplicates.
        return `/${['ecommerce-drone', 'services', segments[0] || 'service-default'].join('/')}`;
    }

    return '/ecommerce-drone/uploads';
};

// Map an image MIME type to a file extension (fallback: the file's own extension).
const extensionForMime = (mimeType, originalName) => {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'image/bmp': 'bmp',
        'image/avif': 'avif',
        'image/tiff': 'tiff',
        'image/x-icon': 'ico',
        'image/heic': 'heic',
        'image/heif': 'heif',
    };
    if (map[mimeType]) return map[mimeType];

    const parts = String(originalName || '').split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    return ext && ext.length <= 5 ? ext.toLowerCase() : 'jpg';
};

// Delete every file stored under `folderPath` (including files in sub-folders).
// Returns the number of files removed.
const deleteFilesInFolder = async (folderPath) => {
    const path = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
    let removed = 0;
    let skip = 0;
    const limit = 100;

    while (true) {
        const files = await imagekit.listFiles({ path, includeFolder: true, limit, skip });
        if (!files || files.length === 0) break;

        const ids = files.map((f) => f.fileId).filter(Boolean);

        // Bulk delete in chunks of 50, falling back to individual deletes.
        for (let i = 0; i < ids.length; i += 50) {
            const chunk = ids.slice(i, i + 50);
            try {
                await imagekit.bulkDeleteFiles(chunk);
            } catch (err) {
                await Promise.all(chunk.map((id) => imagekit.deleteFile(id)));
            }
        }

        removed += ids.length;

        if (files.length < limit) break;
        skip += limit;
    }

    return removed;
};

// Delete a single file by its file name inside `folderPath` (e.g. image-2.jpg).
const deleteFileByName = async (folderPath, name) => {
    const path = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
    const cleanName = String(name || '').trim();
    if (!cleanName) return 0;

    const files = await imagekit.listFiles({ path, includeFolder: false, limit: 100 });
    const matches = (files || []).filter(
        (f) => f.name === cleanName || (f.filePath && f.filePath.endsWith(`/${cleanName}`))
    );

    for (const file of matches) {
        try {
            await imagekit.deleteFile(file.fileId);
        } catch (err) {
            console.error(`[ImageKit] Failed to delete ${cleanName}:`, err.message);
        }
    }
    return matches.length;
};

// Delete a file directly by its public ImageKit URL
const deleteFileByUrl = async (url) => {
    if (!url || typeof url !== 'string') return 0;
    // Only attempt deletion for ImageKit-hosted URLs
    if (!url.includes('imagekit.io')) return 0;

    try {
        const cleanUrl = url.split('?')[0];
        const fileName = cleanUrl.split('/').pop();
        if (!fileName) return 0;

        // Try listing files with this name
        const files = await imagekit.listFiles({ name: fileName, limit: 10 });
        let deleted = 0;
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    await imagekit.deleteFile(file.fileId);
                    deleted++;
                } catch (delErr) {
                    console.error(`[ImageKit] Failed to delete fileId ${file.fileId}:`, delErr.message);
                }
            }
        }
        return deleted;
    } catch (err) {
        console.error(`[ImageKit] Error in deleteFileByUrl for ${url}:`, err.message);
        return 0;
    }
};

// Delete an array of ImageKit URLs
const deleteFilesByUrls = async (urls = []) => {
    if (!Array.isArray(urls) || urls.length === 0) return 0;
    let total = 0;
    for (const u of urls) {
        if (u) {
            const count = await deleteFileByUrl(u);
            total += count;
        }
    }
    return total;
};

module.exports = {
    sanitizeSegment,
    resolveImageKitFolder,
    extensionForMime,
    deleteFilesInFolder,
    deleteFileByName,
    deleteFileByUrl,
    deleteFilesByUrls,
};