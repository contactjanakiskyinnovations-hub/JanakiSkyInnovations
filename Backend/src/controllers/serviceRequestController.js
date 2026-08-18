const ServiceRequest = require('../models/ServiceRequest');

// @desc    Create a service request (works for logged-in & anonymous users)
// @route   POST /api/service-requests
// @access  Public (maps to user if authenticated)
const createServiceRequest = async (req, res) => {
    const { name, email, phone, category, service, message } = req.body;

    if (!name || !phone || !category || !message) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    const isRegistered = !!(req.user && req.user._id);
    const serviceRequest = await ServiceRequest.create({
        user: req.user ? req.user._id : null,
        name,
        email: email || '',
        phone,
        category,
        service: service || '',
        message,
        isRegistered
    });

    res.status(201).json(serviceRequest);
};

// @desc    Get all service requests
// @route   GET /api/service-requests
// @access  Private/Admin
const getServiceRequests = async (req, res) => {
    const requests = await ServiceRequest.find({})
        .sort({ createdAt: -1 })
        .populate('user', 'name email mobile');
    res.json(requests);
};

// @desc    Get service requests for a specific user
// @route   GET /api/service-requests/user/:userId
// @access  Private/Admin
const getServiceRequestsByUser = async (req, res) => {
    const requests = await ServiceRequest.find({ user: req.params.userId })
        .sort({ createdAt: -1 });
    res.json(requests);
};

module.exports = {
    createServiceRequest,
    getServiceRequests,
    getServiceRequestsByUser,
};