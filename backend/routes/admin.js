const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// @route   GET api/admin/reports
// @desc    Get all reports
// @access  Private/Admin
router.get('/reports', [auth, adminAuth], async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reportedBy', ['name', 'email'])
            .populate('reportedUser', ['name', 'email'])
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

// @route   DELETE api/admin/product/:id
// @desc    Remove a product listing
// @access  Private/Admin
router.delete('/product/:id', [auth, adminAuth], async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Product removed by admin' });
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

        user.isBlocked = !user.isBlocked; // Toggle block status
        await user.save();

        res.json({ msg: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/products/reported
// @desc    Get all reported products
// @access  Private/Admin
router.get('/products/reported', [auth, adminAuth], async (req, res) => {
    try {
        // Find products where reports array is not empty
        const products = await Product.find({ 'reports.0': { $exists: true } })
            .populate('seller', ['name', 'email'])
            .populate('reports.reportedBy', ['name', 'email']);
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
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

        // Return full chat without hiddenFor filtering
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

        // Remove message completely (Hard Delete for Admin)
        chat.messages.splice(messageIndex, 1);
        await chat.save();

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

        // Delete the chat
        await Chat.findByIdAndDelete(req.params.chatId);

        // Update associated reports to 'Resolved' (or 'Deleted')
        await Report.updateMany(
            { chat: req.params.chatId },
            { $set: { status: 'Resolved', reportReason: 'Chat deleted by Admin' } }
        );

        res.json({ msg: 'Chat conversation deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
