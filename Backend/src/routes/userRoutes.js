const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserWishlist,
    getUserCart,
    updateUserContact,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getUsers);

router.route('/:id')
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser)
    .delete(protect, admin, deleteUser);

// Wishlist & Cart endpoints for customer inspection by admins
router.route('/:id/wishlist')
    .get(protect, admin, getUserWishlist);

router.route('/:id/cart')
    .get(protect, admin, getUserCart);

// Update customer contact details (email + mobile)
router.route('/:id/contact')
    .put(protect, admin, updateUserContact);

module.exports = router;
