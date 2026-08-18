const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    sku: {
        type: String,
        required: [true, 'Please add a SKU'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    shortSummary: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: [true, 'Please add a price']
    },
    discountPrice: {
        type: Number,
        default: 0
    },
    oldPrice: {
        type: Number
    },
    brand: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: [true, 'Please add a main category']
    },
    subCategory: {
        type: String,
        default: 'tools'
    },
    subSubCategory: {
        type: String
    },
    mainImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1473968512467-3e9c02c0a7e5'
    },
    gallery: [String],
    howToUse: {
        type: String,
        default: ''
    },
    assemblyMaintenance: {
        type: String,
        default: ''
    },
    specifications: {
        type: Map,
        of: String
    },
    comparisonGroup: {
        type: String,
        trim: true,
        default: ''
    },
    comparisonTable: {
        isEnabled: { type: Boolean, default: false },
        comparisonProductOneName: { type: String, default: '' },
        comparisonProductTwoName: { type: String, default: '' },
        rows: [{
            _id: false,
            feature: { type: String, required: true, trim: true },
            selectedProductValue: { type: String, default: '' },
            comparisonProductOneValue: { type: String, default: '' },
            comparisonProductTwoValue: { type: String, default: '' }
        }]
    },
    inTheBox: {
        type: String,
        default: ''
    },
    keyFeatures: {
        type: String,
        default: ''
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock count'],
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    forceNewArrival: {
        type: Boolean,
        default: false
    },
    forceBestSeller: {
        type: Boolean,
        default: false
    },
    // NEW: forcePreOrder - allows customers to order even when stock is 0
    forcePreOrder: {
        type: Boolean,
        default: false
    },
    salesCount: {
        type: Number,
        default: 0,
        min: 0
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, default: '' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: '' },
        isVisible: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],
    ratings: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
