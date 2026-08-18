const express = require('express');
const router = express.Router();
const { checkMobileExists, authUser, registerUser, getUserProfile, updateUserProfile, syncWishlist, syncCart } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const adminAuth = require('./adminAuthRoutes');

// Regular user routes
router.post('/check-mobile', checkMobileExists);
router.post('/register', registerUser);
router.post('/login', authUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Wishlist & Cart sync from storefront to backend (for admin inspection)
router.put('/wishlist', protect, syncWishlist);
router.put('/cart', protect, syncCart);

// Admin routes (separate authentication)
router.use('/admin', adminAuth);

module.exports = router;
