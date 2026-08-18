// Express 5 natively handles async errors — asyncHandler is not needed
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Check if a mobile number is already registered
// @route   POST /api/auth/check-mobile
// @access  Public
const checkMobileExists = async (req, res) => {
    const { mobile } = req.body;

    if (!mobile || typeof mobile !== 'string' || !mobile.trim()) {
        res.status(400);
        throw new Error('Please provide a mobile number');
    }

    const cleanMobile = mobile.trim();
    const user = await User.findOne({ mobile: cleanMobile });
    res.json({ exists: !!user });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password, mobile } = req.body;

    if (mobile) {
        const user = await User.findOne({ mobile });
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(404);
            throw new Error('User with this mobile number does not exist');
        }
        return;
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;

    const queryConditions = [];
    // Only build the duplicate check around non-empty values so mobile-only
    // registrations (where email is absent) are not rejected by the unique
    // email index.
    if (email && typeof email === 'string' && email.trim()) queryConditions.push({ email: email.trim().toLowerCase() });
    if (mobile && typeof mobile === 'string' && mobile.trim()) queryConditions.push({ mobile: mobile.trim() });

    if (queryConditions.length > 0) {
        const userExists = await User.findOne({ $or: queryConditions });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists with this email or mobile');
        }
    }

    try {
        const user = await User.create({
            name,
            // Use undefined when email is blank so the sparse index
            // skips the field entirely (prevents E11000 on null email)
            email: email && typeof email === 'string' && email.trim()
                ? email.trim().toLowerCase()
                : undefined,
            mobile: mobile.trim(),
            password: password || undefined,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (err) {
        // Handle duplicate key errors (E11000) gracefully — e.g. if a stale
        // non-sparse email index still exists, or a race condition.
        if (err.code === 11000) {
            const dupField = Object.keys(err.keyPattern || {}).join(', ') || 'field';
            res.status(400);
            throw new Error(`This ${dupField} is already registered. Please log in instead.`);
        }
        throw err;
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            address: user.address,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Sync wishlist from client-side localStorage to persisted backend storage
// @route   PUT /api/auth/wishlist
// @access  Private
const syncWishlist = async (req, res) => {
    const { wishlist } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // SECURITY: Cap how many items a client can sync at once to prevent
    // unbounded document growth / storage abuse.
    const normalized = (wishlist || []).slice(0, 200).map((item) => ({
        product: item._id || item.id || item.product,
        sku: item.sku || '',
        name: item.name || 'Unnamed Product',
    }));

    user.wishlist = normalized;
    await user.save();

    res.json({ wishlist: user.wishlist });
};

// @desc    Sync cart from client-side localStorage to persisted backend storage
// @route   PUT /api/auth/cart
// @access  Private
const syncCart = async (req, res) => {
    const { cart } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Normalise incoming cart items (store SKU + name + quantity + price snapshot)
    const normalized = (cart || []).slice(0, 200).map((item) => ({
        product: item._id || item.id || item.product,
        sku: item.sku || '',
        name: item.name || 'Unnamed Product',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
    }));

    user.cart = normalized;
    await user.save();

    res.json({ cart: user.cart });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.mobile = req.body.mobile || user.mobile;
        
        if (req.body.address !== undefined) {
            if (typeof req.body.address === 'string') {
                user.address = {
                    street: req.body.address,
                    city: '',
                    state: '',
                    zip: '',
                    country: 'India'
                };
            } else if (req.body.address) {
                user.address = {
                    street: req.body.address.street || user.address.street || '',
                    city: req.body.address.city || user.address.city || '',
                    state: req.body.address.state || user.address.state || '',
                    zip: req.body.address.zip || user.address.zip || '',
                    country: req.body.address.country || user.address.country || 'India'
                };
            }
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            mobile: updatedUser.mobile,
            role: updatedUser.role,
            address: updatedUser.address,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

module.exports = {
    checkMobileExists,
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    syncWishlist,
    syncCart,
};
