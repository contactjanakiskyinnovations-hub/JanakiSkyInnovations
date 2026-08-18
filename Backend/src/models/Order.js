const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            sku: { type: String },
            // Per-line pre-order flag: true when this line item is a pre-order
            // (product had forcePreOrder at checkout). Lets admins see which
            // items in an order are pending stock arrival.
            isPreOrder: { type: Boolean, default: false },
            reviewed: { type: Boolean, default: false },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'Razorpay'
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    taxPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    statusHistory: {
        type: [{
            status: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            note: {
                type: String,
                default: ''
            }
                }],
        default: []
    },
    // Order type: "Normal" or "Pre-Order" when the order contains a pre-order item
    orderType: {
        type: String,
        enum: ['Normal', 'Pre-Order'],
        default: 'Normal'
    },
    salesCounted: {
        type: Boolean,
        default: false
    },
    // E-Invoice data, auto-generated when the order is marked Delivered.
    // This is the structured invoice sent to the customer (and viewable/downloadable
    // by the customer and by the admin) per the requirement that the invoice
    // "be made available" after delivery.
    eInvoice: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Middleware to track status changes
orderSchema.pre('save', function() {
    // Only track status changes for existing documents being updated
    // New orders will have their initial status set without history entry
    if (!this.isNew && this.isModified('status')) {
        // Ensure statusHistory array exists before pushing
        if (!this.statusHistory) {
            this.statusHistory = [];
        }
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`
        });
    }
});

module.exports = mongoose.model('Order', orderSchema);


