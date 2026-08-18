const express = require('express');
const router = express.Router();
const {
    createServiceRequest,
    getServiceRequests,
    getServiceRequestsByUser,
} = require('../controllers/serviceRequestController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getServiceRequests)
    .post(optionalProtect, createServiceRequest);

// Must be defined before '/:id' so "user/:userId" is not treated as an ObjectId
router.route('/user/:userId')
    .get(protect, admin, getServiceRequestsByUser);

module.exports = router;