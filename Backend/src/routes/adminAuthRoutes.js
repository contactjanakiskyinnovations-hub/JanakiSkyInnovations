const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// @desc    Check if any admin account exists (for first-time setup detection)
// @route   GET /api/admin/check-setup
// @access  Public
router.get('/check-setup', async (req, res) => {
    const count = await Admin.countDocuments();
    res.json({ configured: count > 0 });
});

// @desc    Check if admin mobile exists
// @route   POST /api/admin/check-mobile
// @access  Public
router.post('/check-mobile', async (req, res) => {
    const { mobile } = req.body;

    if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
        res.status(400);
        throw new Error('Please provide a mobile number');
    }

    const cleanMobile = mobile.trim();
    const admin = await Admin.findOne({ mobile: cleanMobile });
    res.json({ exists: !!admin });
});

// @desc    Admin register (first time setup)
// @route   POST /api/admin/register
// @access  Public
router.post('/register', async (req, res) => {
    const { email, mobile, password } = req.body;

    if (!email || !mobile || !password) {
        res.status(400);
        throw new Error('Please add all fields: email, mobile, password');
    }

    // SECURITY: Only allow admin registration during first-time setup.
    // Once an admin account exists, registration is permanently disabled so
    // anonymous attackers cannot create their own admin accounts.
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
        res.status(403);
        throw new Error('Admin account already configured. Registration is disabled.');
    }

    const emailExists = await Admin.findOne({ email });
    if (emailExists) {
        res.status(400);
        throw new Error('Admin with this email already exists');
    }

    const mobileExists = await Admin.findOne({ mobile });
    if (mobileExists) {
        res.status(400);
        throw new Error('Admin with this mobile number already exists');
    }

    try {
        const admin = await Admin.create({
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password,
        });

        res.status(201).json({
            _id: admin._id,
            name: admin.name || 'Admin',
            email: admin.email,
            mobile: admin.mobile,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400);
        throw new Error('Please provide email address');
    }
    if (!password) {
        res.status(400);
        throw new Error('Please provide password');
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select('+password');

    if (admin && (await admin.matchPassword(password))) {
        res.json({
            _id: admin._id,
            name: admin.name || 'Admin',
            email: admin.email,
            mobile: admin.mobile,
            role: admin.role,
            token: generateToken(admin._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Admin forgot password - send OTP to mobile
// @route   POST /api/admin/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    const { mobile } = req.body;

    if (!mobile) {
        res.status(400);
        throw new Error('Please provide mobile number');
    }

    const admin = await Admin.findOne({ mobile }).select('+otp +otpExpire');

    if (!admin) {
        res.status(404);
        throw new Error('Admin with this mobile number not found');
    }

    // Generate a 6-digit OTP (cryptographically secure RNG)
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    // OTP valid for 10 minutes
    admin.otp = otp;
    admin.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    // For now, just log to console (real SMS gateway integration comes later)
    console.log('==============================================');
    console.log(`[ADMIN OTP] Mobile: ${admin.mobile}`);
    console.log(`[ADMIN OTP] OTP: ${otp}`);
    console.log(`[ADMIN OTP] Valid for: 10 minutes`);
    console.log('==============================================');

    res.json({
        message: 'OTP sent to admin mobile number (see server console)',
        adminId: admin._id,
        // DEV-ONLY convenience: expose the OTP in the API response so the
        // frontend can log it to the browser console. In production (once a
        // real SMS gateway is integrated) this MUST be removed.
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
});

// @desc    Admin reset password with OTP verification
// @route   POST /api/admin/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword) {
        res.status(400);
        throw new Error('Please provide all fields: mobile, otp, newPassword');
    }

    const admin = await Admin.findOne({ mobile }).select('+otp +otpExpire');

    if (!admin) {
        res.status(404);
        throw new Error('Admin with this mobile number not found');
    }

    // Verify OTP: must match AND not be expired
    if (!admin.otp || admin.otp !== otp) {
        res.status(400);
        throw new Error('Invalid OTP');
    }
    if (!admin.otpExpire || admin.otpExpire < new Date()) {
        res.status(400);
        throw new Error('OTP has expired. Please request a new one');
    }

    try {
        admin.password = newPassword;
        admin.otp = undefined;
        admin.otpExpire = undefined;
        await admin.save();

        console.log(`[ADMIN] Password reset successfully for ${admin.email}`);
        res.json({
            message: 'Password reset successfully. Please login with your new password.',
            _id: admin._id,
        });
    } catch (err) {
        res.status(400);
        throw new Error(err.message);
    }
});

module.exports = router;
