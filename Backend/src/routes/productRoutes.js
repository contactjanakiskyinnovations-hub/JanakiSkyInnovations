const express = require('express');
const router = express.Router();
const {
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
    addProductReview,
    updateReviewVisibility,
    deleteReview,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);

router.route('/compare')
    .get(compareProducts);

router.route('/promotion-settings')
    .get(protect, admin, getPromotionSettings)
    .put(protect, admin, updatePromotionSettings);

router.route('/:id/promotions')
    .put(protect, admin, updateProductPromotions);

router.route('/:id/pre-order')
    .put(protect, admin, toggleProductPreOrder);

// Rate a product after the customer's order is delivered
router.route('/:id/reviews')
    .post(protect, addProductReview);

router.route('/:id/reviews/:reviewId')
    .put(protect, admin, updateReviewVisibility)
    .delete(protect, admin, deleteReview);

router.route('/:id')
    .get(getProductById)
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

router.route('/:id/related')
    .get(getRelatedProducts);

module.exports = router;
