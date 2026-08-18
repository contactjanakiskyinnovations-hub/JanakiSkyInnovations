const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Build the structured e-invoice object from an order document.
 * Called automatically when an order's status transitions to "Delivered".
 */
const generateEInvoice = async (order) => {
    // Generate a unique, human-readable purchase summary number
    const purchaseSummaryNumber = 'INV' + order._id.toString().slice(-8).toUpperCase() + Date.now().toString().slice(-6);

    // Helper to flatten the shipping address + user into invoice address blocks
    const user = order.user || {};
    const sa = order.shippingAddress || {};
    const fullAddress = [sa.address, sa.city, sa.state, sa.zip, sa.country]
        .filter(Boolean).join(', ') || 'N/A';

    const userName = (user && (user.name || user.email)) || sa.name || 'Customer';
    const phone = sa.phone || user?.mobile || user?.phone || 'N/A';

    // Resolve the REAL product SKU for each line item. orderItems.product may
    // arrive as an ObjectId (not populated), a populated Product document, or be
    // already cached on the item as `sku` (captured at checkout). Avoids leaking
    // the mongodb `_id` into the invoice.
    const skuCache = {};
    const items = await Promise.all((order.orderItems || []).map(async (item) => {
        const price = item.price || 0;
        const qty = item.qty || 0;

        let shopSku = item.sku || '';
        if (!shopSku) {
            const prod = item.product;
            if (prod && typeof prod === 'object' && prod.sku) {
                shopSku = prod.sku;
            } else if (prod && typeof prod !== 'object') {
                const id = String(prod);
                if (!(id in skuCache)) {
                    const productDoc = await Product.findById(id).select('sku').lean();
                    skuCache[id] = productDoc ? productDoc.sku : '';
                }
                shopSku = skuCache[id];
            }
        }

        return {
            productName: item.name || 'Product',
            shopSku,
            sellerSku: shopSku,
            size: item.size || '',
            paidPrice: price,
            price: price,
            quantity: qty,
            itemTotal: Number((price * qty).toFixed(2)),
        };
    }));

    const subtotal = Number(order.itemsPrice || 0);
    const shippingCost = Number(order.shippingPrice || 0);

    return {
        purchaseSummaryNumber,
        purchaseDate: order.deliveredAt || order.createdAt,
        paymentMethod: order.paymentMethod || 'Cash on Delivery',
        billTo: {
            name: userName,
            address: fullAddress,
            phone,
        },
        deliverTo: {
            name: userName,
            address: fullAddress,
            phone,
        },
        items,
        subtotal,
        shippingCost,
        voucher: 0,
        total: Number(order.totalPrice || 0),
        generatedAt: new Date(),
    };
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        let query = {};
        
        // Status filter
        if (req.query.status && req.query.status !== 'All') {
            query.status = req.query.status;
        }

        // Keyword search
        if (req.query.keyword) {
            const keyword = req.query.keyword;
            // Escape regex special characters so user input is always treated as literal text
            const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const User = require('../models/User');
            // Try to find users matching name, email or mobile
            const matchingUsers = await User.find({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { email: { $regex: keyword, $options: 'i' } },
                    { mobile: { $regex: keyword, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);

            const conditions = [
                { paymentMethod: { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.address': { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.city': { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.state': { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.zip': { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.country': { $regex: keyword, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: keyword, $options: 'i' } },
                { 'orderItems.name': { $regex: keyword, $options: 'i' } }
            ];

            // Partial order ID search: matches any part of the hex ObjectId string
            conditions.push({
                $expr: {
                    $regexMatch: {
                        input: { $toString: '$_id' },
                        regex: escapeRegex(keyword),
                        options: 'i'
                    }
                }
            });

            // Full valid ObjectId match (most efficient path for a complete id)
            if (mongoose.isValidObjectId(keyword)) {
                conditions.push({ _id: keyword });
            }

            if (userIds.length > 0) {
                conditions.push({ user: { $in: userIds } });
            }

            // Combine keyword conditions with existing query status
            if (query.status) {
                query = {
                    $and: [
                        { status: query.status },
                        { $or: conditions }
                    ]
                };
            } else {
                query = { $or: conditions };
            }
        }

        const orders = await Order.find(query)
            .populate('user', 'id name email')
            .populate('orderItems.product', 'sku name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'id name email').populate('orderItems.product', 'sku name');
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        // Customers can only view their own orders; admins can view any
        if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Not authorized to view this order' });
            return;
        }

        res.json(order);
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email mobile');
        if (order) {
            const previousStatus = order.status;
            order.status = req.body.status || order.status;
            
            if (req.body.status === 'Delivered') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();

                // Auto-generate the e-invoice when the order is marked Delivered.
                // The invoice is generated once (only if not already present) so it
                // remains stable across subsequent status updates.
                if (!order.eInvoice) {
                    order.eInvoice = await generateEInvoice(order);
                }
            }
            
            if (req.body.status === 'Shipped') {
                // If paid method was Razorpay, set Paid
                if (order.paymentMethod === 'Razorpay') {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                }
            }

            if (req.body.status === 'Delivered' && !order.salesCounted) {
                await Promise.all(order.orderItems.map(item =>
                    Product.findByIdAndUpdate(item.product, { $inc: { salesCount: item.qty } })
                ));
                order.salesCounted = true;
            }

            if (req.body.status === 'Cancelled' && previousStatus !== 'Cancelled' && order.salesCounted) {
                await Promise.all(order.orderItems.map(item =>
                    Product.findByIdAndUpdate(item.product, { $inc: { salesCount: -item.qty } })
                ));
                order.salesCounted = false;
            }

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            await order.deleteOne();
            res.json({ message: 'Order removed successfully' });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod } = req.body;

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            res.status(400).json({ message: 'No order items' });
            return;
        }

        const addressFields = ['address', 'city', 'state', 'zip', 'country'];
        if (!shippingAddress || addressFields.some(field => !shippingAddress[field]?.trim())) {
            res.status(400).json({ message: 'A complete shipping address is required' });
            return;
        }

        const validatedItems = [];
        let hasPreOrder = false;
        for (const item of orderItems) {
            if (!mongoose.isValidObjectId(item.product) || !Number.isInteger(item.qty) || item.qty < 1) {
                res.status(400).json({ message: 'Invalid order item' });
                return;
            }

            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404).json({ message: 'A product in your cart is no longer available' });
                return;
            }
            if (!product.forcePreOrder && product.stock < item.qty) {
                res.status(400).json({ message: `${product.name} does not have enough stock` });
                return;
            }
            if (product.forcePreOrder) hasPreOrder = true;

            const basePrice = product.discountPrice > 0 && product.discountPrice < product.price
                ? product.discountPrice
                : product.price;
            // Store the VAT-inclusive unit price (13%) so totals stay consistent everywhere.
            const VAT_RATE = 0.13;
            const price = Math.round(basePrice * (1 + VAT_RATE) * 100) / 100;
            validatedItems.push({
                name: product.name,
                qty: item.qty,
                image: product.mainImage || product.gallery?.[0] || '',
                price,
                sku: product.sku || '',
                isPreOrder: !!product.forcePreOrder,
                product: product._id,
            });
        }

        const itemsPrice = Math.round(validatedItems.reduce((total, item) => total + item.price * item.qty, 0) * 100) / 100;
        // Prices already include 13% VAT, so there is no separate tax line.
        const taxPrice = 0;
        // Free delivery above ₹2,000, otherwise a flat ₹150 charge.
        const shippingPrice = itemsPrice >= 2000 ? 0 : 150;
        const totalPrice = Math.round((itemsPrice + taxPrice + shippingPrice) * 100) / 100;

        const order = new Order({
            user: req.user._id,
            orderItems: validatedItems,
            shippingAddress,
            paymentMethod,
            orderType: hasPreOrder ? 'Pre-Order' : 'Normal',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice
        });

        const createdOrder = await order.save();
        await Promise.all(validatedItems.map(item =>
            Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } })
        ));
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('user', 'id name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

// @desc    Get orders for a specific user (admin)
// @route   GET /api/orders/user/:userId
// @access  Private/Admin
const getOrdersByUser = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId })
            .populate('user', 'id name email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('[500]', error);
        res.status(500).json({ message: 'Internal server error. Please try again.' });
    }
};

module.exports = {
    getOrders,
    getMyOrders,
    getOrdersByUser,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrder,
    generateEInvoice
};
