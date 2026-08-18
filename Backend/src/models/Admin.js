const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please add an email'],
        trim: true,
        lowercase: true,
        match: [/^[\w\.\-]+@([\w\-]+\.)+[\w\-]{2,63}$/, 'Please fill a valid email address'],
        unique: true,
    },
    mobile: {
        type: String,
        required: [true, 'Please add a mobile number'],
        trim: true,
        match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // SECURITY: never returned by default in queries
    },
    role: {
        type: String,
        default: 'admin',
    },
    // Password-reset OTP fields (used by the forgot-password flow)
    otp: {
        type: String,
        select: false,
    },
    otpExpire: {
        type: Date,
        select: false,
    },
}, { timestamps: true });

// Encrypt password using bcrypt before saving
adminSchema.pre('save', async function() {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
adminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);

