const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
        // NOTE: unique is NOT set at field level. A sparse unique index is
        // defined below so users can register with mobile only (no email).
    },
    mobile: {
        type: String,
        required: [true, 'Please add a mobile number'],
        unique: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        minlength: 6,
        select: false
    },
        address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: { type: String, default: 'India' }
    },
    // Wishlist & Cart persistence — stores product references with SKU metadata
    // so the admin panel can inspect what a customer has saved or intends to buy.
    wishlist: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        sku: { type: String, trim: true },
        name: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }],
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        sku: { type: String, trim: true },
        name: { type: String, required: true },
        quantity: { type: Number, default: 1, min: 1 },
        price: { type: Number, default: 0 },
        addedAt: { type: Date, default: Date.now }
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Sparse unique index on email: allows unlimited users WITHOUT an email
// (mobile-only registrations) while still preventing duplicate emails for
// users who DO provide one. This avoids the E11000 duplicate key error on
// { email: null } that occurs with a non-sparse unique index.
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Before saving, ensure a blank/null email is fully removed from the document.
// A sparse unique index skips documents where the field is MISSING, but it
// does NOT skip documents where the field is explicitly set to null — so a
// second mobile-only user with email:null would violate the unique index.
// Note: Mongoose 9 middleware does NOT receive a next callback — returning
// a value or promise is enough (synchronous here).
userSchema.pre('save', function() {
    if (!this.email || !this.email.trim()) {
        this.email = undefined; // omit field so sparse index ignores this doc
    }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
