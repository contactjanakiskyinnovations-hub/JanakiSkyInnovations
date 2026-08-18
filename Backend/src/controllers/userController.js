// Express 5 natively handles async errors — asyncHandler is not needed
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    let query = {};
    if (req.query.keyword) {
        query = {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { email: { $regex: req.query.keyword, $options: 'i' } },
                { mobile: { $regex: req.query.keyword, $options: 'i' } }
            ]
        };
    }
    const users = await User.find(query);
    res.json(users);
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.mobile = req.body.mobile || user.mobile;
        user.role = req.body.role || user.role;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Get a customer's wishlist (with product + SKU details)
// @route   GET /api/users/:id/wishlist
// @access  Private/Admin
const getUserWishlist = async (req, res) => {
    const user = await User.findById(req.params.id)
        .populate('wishlist.product', 'sku name price mainImage stock')
        .select('wishlist name mobile email');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        wishlist: user.wishlist
    });
};

// @desc    Get a customer's cart (with product + SKU details)
// @route   GET /api/users/:id/cart
// @access  Private/Admin
const getUserCart = async (req, res) => {
    const user = await User.findById(req.params.id)
        .populate('cart.product', 'sku name price mainImage stock')
        .select('cart name mobile email');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        cart: user.cart
    });
};

// @desc    Update a customer's email and/or mobile
// @route   PUT /api/users/:id/contact
// @access  Private/Admin
const updateUserContact = async (req, res) => {
    const { email, mobile } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;

    const updated = await user.save();

    res.json({
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile,
        role: updated.role
    });
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserWishlist,
    getUserCart,
    updateUserContact,
};
