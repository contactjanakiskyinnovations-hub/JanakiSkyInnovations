// Express 5 natively handles async errors — asyncHandler is not needed
const HomeSettings = require('../models/HomeSettings');

// @desc    Get Home Settings
// @route   GET /api/cms
// @access  Public
const getHomeSettings = async (req, res) => {
    let settings = await HomeSettings.findOne();
    if (!settings) {
        // Create default if none exists
        settings = await HomeSettings.create({});
    }
    // Ensure contactIcons defaults are provided if empty
    if (!settings.contactIcons || settings.contactIcons.length === 0) {
        settings.contactIcons = [
            { platform: 'Messenger', iconName: 'MessageCircle', url: 'https://m.me/janakiskyinnovations', isActive: true },
            { platform: 'WhatsApp', iconName: 'WhatsApp', url: 'https://wa.me/917742228345?text=Hi!%20I%20need%20some%20assistance%20with%20Janaki%20Sky%20Innovations.', isActive: true }
        ];
    }
    res.json(settings);
};

// @desc    Update Home Settings
// @route   PUT /api/cms
// @access  Private/Admin
const updateHomeSettings = async (req, res) => {
    try {
                let settings = await HomeSettings.findOne();

        // Capture OLD image signature BEFORE merge so we can detect changes
        // and bump the version counter when any CMS-managed image URL changes.
        const imageSignature = (obj) => {
            const imgs = [
                obj?.logoImage,
                ...((obj?.heroSliders || []).map((s) => s?.image).filter(Boolean)),
                ...((obj?.promoBanners || []).map((p) => p?.image).filter(Boolean)),
                ...((obj?.featuredCategories || []).map((f) => f?.image).filter(Boolean)),
                ...((obj?.categoryBanners || []).map((b) => b?.image).filter(Boolean)),
                ...((obj?.offers?.bundleDeals || []).map((b) => b?.image).filter(Boolean)),
            ].filter(Boolean).sort();
            return imgs.join('|');
        };

        const oldSignature = settings ? imageSignature(settings.toObject()) : '';

        if (!settings) {
            // Create new settings with provided data
            settings = new HomeSettings(req.body);
        } else {
            // Update existing settings - merge carefully
            if (req.body.logoImage !== undefined) settings.logoImage = req.body.logoImage;
            if (Array.isArray(req.body.heroSliders)) settings.heroSliders = req.body.heroSliders;
            if (Array.isArray(req.body.promoBanners)) settings.promoBanners = req.body.promoBanners;
            if (Array.isArray(req.body.featuredCategories)) settings.featuredCategories = req.body.featuredCategories;
            if (Array.isArray(req.body.categoryBanners)) settings.categoryBanners = req.body.categoryBanners;

            if (req.body.coupons !== undefined) settings.coupons = req.body.coupons;
            if (req.body.services !== undefined) settings.services = req.body.services;
            if (req.body.serviceCategories !== undefined) settings.serviceCategories = req.body.serviceCategories;
            if (req.body.footer) settings.footer = req.body.footer;
            if (req.body.socialMediaIcons) settings.socialMediaIcons = req.body.socialMediaIcons;
            if (req.body.contactIcons) settings.contactIcons = req.body.contactIcons;
            if (req.body.offers) settings.offers = req.body.offers;
        }

        // Detect image changes: if signature changed, bump the version for cache-busting
        if (imageSignature(settings.toObject()) !== oldSignature) {
            settings.imageVersion = (settings.imageVersion || 0) + 1;
        }

        await settings.save();
        res.json(settings);
    } catch (error) {
        console.error('Error saving CMS settings:', error);
        res.status(500).json({
            message: 'Failed to save settings',
            error: 'Internal server error. Please try again.' });
    }
};

module.exports = {
    getHomeSettings,
    updateHomeSettings,
};
