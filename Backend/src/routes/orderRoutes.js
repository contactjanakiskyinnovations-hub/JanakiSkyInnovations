const express = require('express');
const router = express.Router();
const {
    getOrders,
    getMyOrders,
    getOrdersByUser,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrder
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getOrders)
    .post(protect, createOrder);

// Must be defined before '/:id' so "my-orders" / "user/:userId" are not treated as ObjectIds
router.route('/my-orders')
    .get(protect, getMyOrders);

router.route('/user/:userId')
    .get(protect, admin, getOrdersByUser);

router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, admin, deleteOrder);

router.route('/:id/status')
    .put(protect, admin, updateOrderStatus);

module.exports = router;
