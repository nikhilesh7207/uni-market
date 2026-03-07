const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ReportedChat = require('../models/ReportedChat');

// @route   POST api/reports/chat
// @desc    Report a full conversation
// @access  Private
router.post('/chat', auth, async (req, res) => {
    const { reporterId, reportedUserId, productId, chatMessages } = req.body;

    try {
        // Validate required fields
        if (!reporterId || !reportedUserId || !chatMessages || !Array.isArray(chatMessages)) {
            return res.status(400).json({ msg: 'Please provide all required fields including chat history.' });
        }

        // Verify reporter ID matches logged in user
        if (req.user.id !== reporterId) {
            return res.status(401).json({ msg: 'Not authorized to report as this user' });
        }

        const newReportedChat = new ReportedChat({
            reporterId,
            reportedUserId,
            productId,
            chatHistory: chatMessages.map(msg => ({
                sender: msg.sender._id || msg.sender,
                content: msg.content,
                time: msg.time || msg.timestamp || new Date(),
                _id: msg._id
            }))
        });

        await newReportedChat.save();

        // Emit to admins via global socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new_reported_chat', newReportedChat);
        }

        res.json({ msg: 'Chat reported successfully and sent to admin.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
