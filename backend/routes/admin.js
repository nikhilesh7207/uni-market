const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const ReportedChat = require('../models/ReportedChat');
const Order = require('../models/Order');
const AdminLog = require('../models/AdminLog');
const bcrypt = require('bcryptjs');

// Helper function to log admin actions
const logAdminAction = async (adminId, action, targetId = null, targetModel = null, details = '') => {
    try {
        await AdminLog.create({ adminId, action, targetId, targetModel, details });
    } catch (err) {
        console.error("Failed to log admin action:", err);
    }
};

// ==========================================
// DASHBOARD & ANALYTICS
// ==========================================

// @route   GET api/admin/dashboard
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Aggregate total revenue
        const revenueAggregation = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        // Recent Activity
        const recentActivity = await AdminLog.find()
            .populate('adminId', 'name email profilePic')
            .sort({ createdAt: -1 })
            .limit(10);

        // Chart Data: Monthly Revenue (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Chart Data: User Growth (Last 6 Months)
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    users: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        res.json({
            overview: { totalUsers, totalProducts, totalOrders, totalRevenue },
            recentActivity,
            charts: { monthlyRevenue, userGrowth }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// USER MANAGEMENT
// ==========================================

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/block/:id
// @desc    Block/Unblock a user
// @access  Private/Admin
router.post('/block/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isBlocked = !user.isBlocked;
        await user.save();

        await logAdminAction(req.user.id, user.isBlocked ? 'Blocked User' : 'Unblocked User', user._id, 'User', `Admin ${user.isBlocked ? 'blocked' : 'unblocked'} user ${user.email}`);

        res.json({ msg: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/user/:id
// @desc    Hard delete a user
// @access  Private/Admin
router.delete('/user/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        await User.findByIdAndDelete(req.params.id);
        await Product.deleteMany({ seller: req.params.id });

        await logAdminAction(req.user.id, 'Deleted User', null, 'User', `Admin deleted user ${user.email}`);

        res.json({ msg: 'User and all their products deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

// @route   GET api/admin/products/reported
// @desc    Get all reported products
// @access  Private/Admin
router.get('/products/reported', [auth, adminAuth], async (req, res) => {
    try {
        const products = await Product.find({ 'reports.0': { $exists: true } })
            .populate('seller', ['name', 'email'])
            .populate('reports.reportedBy', ['name', 'email']);
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/products
// @desc    Get all products
// @access  Private/Admin
router.get('/products', [auth, adminAuth], async (req, res) => {
    try {
        const products = await Product.find().populate('seller', ['name', 'email']).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/product
// @desc    Add a product listing
// @access  Private/Admin
router.post('/product', [auth, adminAuth], async (req, res) => {
    try {
        const { name, description, category, price, stock, images } = req.body;
        const newProduct = new Product({
            name, description, category, price, stock, images, seller: req.user.id
        });
        const product = await newProduct.save();
        await logAdminAction(req.user.id, 'Created Product', product._id, 'Product', `Admin created product ${name}`);
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/product/:id
// @desc    Edit a product listing
// @access  Private/Admin
router.put('/product/:id', [auth, adminAuth], async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        await logAdminAction(req.user.id, 'Updated Product', product._id, 'Product', `Admin updated product ${product.name}`);
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/product/:id
// @desc    Remove a product listing
// @access  Private/Admin
router.delete('/product/:id', [auth, adminAuth], async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Resolve all reports associated with this product
        await Report.updateMany(
            { product: req.params.id },
            { $set: { status: 'resolved', adminNotes: 'Product deleted by Admin' } }
        );

        await logAdminAction(req.user.id, 'Deleted Product', null, 'Product', `Admin deleted product ${product.name}`);
        res.json({ msg: 'Product removed by admin and reports resolved' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ORDER MANAGEMENT
// ==========================================

// @route   GET api/admin/orders
// @desc    Get all orders
// @access  Private/Admin
router.get('/orders', [auth, adminAuth], async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('customer', ['name', 'email'])
            .populate('products.product', ['name', 'images', 'price'])
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/order/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put('/order/:id/status', [auth, adminAuth], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        await logAdminAction(req.user.id, 'Updated Order Status', order._id, 'Order', `Admin updated order status to ${status}`);
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// REPORTS & CHAT MANAGEMENT
// ==========================================

// @route   GET api/admin/reports
// @desc    Get all reports
// @access  Private/Admin
router.get('/reports', [auth, adminAuth], async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', ['name', 'email'])
            .populate('reportedUser', ['name', 'email'])
            .populate('product', ['name', 'images', 'price'])
            .populate({
                path: 'chat',
                populate: { path: 'participants', select: 'name email profilePic' }
            })
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/report/:id/resolve
// @desc    Mark report as resolved
// @access  Private/Admin
router.put('/report/:id/resolve', [auth, adminAuth], async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
        if (!report) return res.status(404).json({ msg: 'Report not found' });
        await logAdminAction(req.user.id, 'Resolved Report', report._id, 'Report', `Admin resolved report ${report._id}`);
        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/chat/:chatId/full
// @desc    Get full chat history for admin
// @access  Private/Admin
router.get('/chat/:chatId/full', [auth, adminAuth], async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId)
            .populate('participants', ['name', 'email', 'profilePic'])
            .populate('messages.sender', ['name', 'email']);

        if (!chat) return res.status(404).json({ msg: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/chat/:chatId/message/:messageId
// @desc    Delete a specific message (Admin)
// @access  Private/Admin
router.delete('/chat/:chatId/message/:messageId', [auth, adminAuth], async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        const messageIndex = chat.messages.findIndex(m => m._id.toString() === req.params.messageId);
        if (messageIndex === -1) return res.status(404).json({ msg: 'Message not found' });

        chat.messages.splice(messageIndex, 1);
        await chat.save();

        await logAdminAction(req.user.id, 'Deleted Message', chat._id, 'Chat', 'Admin deleted a chat message');
        res.json({ msg: 'Message deleted successfully', messages: chat.messages });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/chat/:chatId
// @desc    Delete entire conversation (Admin)
// @access  Private/Admin
router.delete('/chat/:chatId', [auth, adminAuth], async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        await Chat.findByIdAndDelete(req.params.chatId);
        await Report.updateMany(
            { chat: req.params.chatId },
            { $set: { status: 'Resolved', reportReason: 'Chat deleted by Admin' } }
        );

        await logAdminAction(req.user.id, 'Deleted Chat', null, 'Chat', `Admin deleted chat conversation ${req.params.chatId}`);
        res.json({ msg: 'Chat conversation deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// REPORTED FULL CHAT MODERATION
// ==========================================

// @route   GET api/admin/reported-chats
// @desc    Get all reported chats with full history
// @access  Private/Admin
router.get('/reported-chats', [auth, adminAuth], async (req, res) => {
    try {
        const reportedChats = await ReportedChat.find()
            .populate('reporterId', ['name', 'email', 'profilePic'])
            .populate('reportedUserId', ['name', 'email', 'profilePic'])
            .populate('productId', ['name'])
            .populate('chatHistory.sender', ['name', 'email', 'profilePic'])
            .sort({ reportedAt: -1 });
        res.json(reportedChats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/admin/reported-chats/:id/review
// @desc    Mark a reported chat as reviewed
// @access  Private/Admin
router.put('/reported-chats/:id/review', [auth, adminAuth], async (req, res) => {
    try {
        const reportedChat = await ReportedChat.findByIdAndUpdate(req.params.id, { status: 'reviewed' }, { new: true });
        if (!reportedChat) return res.status(404).json({ msg: 'Reported Chat not found' });

        await logAdminAction(req.user.id, 'Reviewed Reported Chat', reportedChat._id, 'ReportedChat', `Admin marked reported chat as reviewed`);
        res.json(reportedChat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/admin/reported-chats/:id
// @desc    Delete a reported chat and its history
// @access  Private/Admin
router.delete('/reported-chats/:id', [auth, adminAuth], async (req, res) => {
    try {
        const reportedChat = await ReportedChat.findByIdAndDelete(req.params.id);
        if (!reportedChat) return res.status(404).json({ msg: 'Reported Chat not found' });

        await logAdminAction(req.user.id, 'Deleted Reported Chat', null, 'ReportedChat', `Admin deleted a reported chat history`);
        res.json({ msg: 'Reported Chat deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ==========================================
// ADMIN PROFILE
// ==========================================

// @route   PUT api/admin/profile
// @desc    Update admin profile
// @access  Private/Admin
router.put('/profile', [auth, adminAuth], async (req, res) => {
    try {
        const { name, email, profilePic } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { name, email, profilePic }, { new: true }).select('-password');
        await logAdminAction(req.user.id, 'Updated Profile', user._id, 'User', 'Admin updated their own profile details');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const validatePassword = (password) => {
    return password.length >= 6;
};

// @route   PUT api/admin/password
// @desc    Update admin password
// @access  Private/Admin
router.put('/password', [auth, adminAuth], async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid current password' });

        if (!validatePassword(newPassword)) return res.status(400).json({ msg: 'Password must be at least 6 characters' });

        user.password = newPassword;
        await user.save();

        await logAdminAction(req.user.id, 'Changed Password', user._id, 'User', 'Admin changed their password');

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
