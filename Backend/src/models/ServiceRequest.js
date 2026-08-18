const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: { type: String, required: true, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    category: { type: String, default: '' },
    service: { type: String, default: '' },
    message: { type: String, default: '' },
    isRegistered: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['New', 'In Progress', 'Completed'],
        default: 'New'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
