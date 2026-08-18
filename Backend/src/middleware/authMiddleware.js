const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Express 5 handles async errors natively — no asyncHandler needed
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token — try regular User first, then Admin
            // (admin tokens are signed with the Admin document _id)
            let account = await User.findById(decoded.id).select('-password');
            if (!account) {
                account = await Admin.findById(decoded.id).select('-password');
            }
            if (account) {
                req.user = account;
                req.admin = account.role === 'admin' ? account : null;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};

// Optional auth middleware - sets req.user if a valid token is present, but does not throw.
// Used for endpoints that work for both logged-in and anonymous users.
const optionalProtect = async (req, res, next) => {
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Try regular User first, then Admin (admin tokens use the Admin _id)
            let account = await User.findById(decoded.id).select('-password');
            if (!account) {
                account = await Admin.findById(decoded.id).select('-password');
            }
            req.user = account;
        } catch (error) {
            req.user = null;
        }
    }
    next();
};

// Admin middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, optionalProtect, admin };
