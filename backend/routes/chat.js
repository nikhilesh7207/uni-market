const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Report = require('../models/Report');

// @route   POST api/chat/start
// @desc    Start or get existing chat for a product
// @access  Private
router.post('/start', auth, async (req, res) => {
    const { productId, sellerId } = req.body;

    try {
        // Check if chat exists between these two users for this product
        let chat = await Chat.findOne({
            product: productId,
            participants: { $all: [req.user.id, sellerId] }
        }).populate('participants', ['name', 'profilePic']);

        if (chat) {
            return res.json(chat);
        }

        // Create new chat
        chat = new Chat({
            product: productId,
            participants: [req.user.id, sellerId],
            messages: []
        });

        await chat.save();
        chat = await chat.populate('participants', ['name', 'profilePic']);

        res.json(chat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/user
// @desc    Get all chats for current user
// @access  Private
router.get('/user', auth, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.id,
            deletedBy: { $ne: req.user.id }
        })
            .populate('participants', ['name', 'profilePic'])
            .populate('product', ['name', 'images'])
            .sort({ updatedAt: -1 });

        console.log(`[DEBUG API] Fetching chats for user ID: ${req.user.id}. Found: ${chats.length} chats.`);

        res.json(chats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/:chatId
// @desc    Get chat by ID
// @access  Private
// Pagination
router.get('/:chatId', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        let query = Chat.findById(req.params.chatId)
            .populate('participants', ['name', 'profilePic'])
            .populate('messages.sender', ['name'])
            .populate('product', ['name', 'images', 'price']);

        // Simple pagination: if not full history requested, slice messages
        if (req.query.full !== 'true') {
            // We can't easily use .slice() with populate in all mongoose versions perfectly for tailored pagination 
            // without losing the 'populate' sometimes or having issue with counts.
            // But for "Load previous", we usually want the last N messages.
            // This simple approach fetches all and measures, or uses slice if supported.
            // For stability in this fix, we'll fetch then slice in memory if it's not huge, 
            // OR use the projection. 
            // Let's use standard projection slice for the messages array.
            query.select({ messages: { $slice: -1 * limit } });
        }

        let chat = await query;

        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // Verify participant
        if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Reset unread count for this user
        if (chat.unreadCounts) {
            chat.unreadCounts.set(req.user.id, 0);
            await chat.save();
        }

        // Filter out hidden messages for this user
        chat.messages = chat.messages.filter(msg =>
            !msg.hiddenFor.includes(req.user.id)
        );

        res.json(chat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/chat/:chatId/message
// @desc    Add message to chat
// @access  Private
router.post('/:chatId/message', auth, async (req, res) => {
    const { content, replyTo } = req.body; // replyTo: { messageId, content, senderName }
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // Verify participant
        if (!chat.participants.some(p => p.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check if sender is blocked by admin
        if (req.user.isBlocked) {
            return res.status(403).json({ msg: 'Your account is blocked. You cannot send messages.' });
        }

        const sender = await User.findById(req.user.id);

        // Identify other participant
        const otherParticipantId = chat.participants.find(p => p.toString() !== req.user.id);
        const otherParticipant = await User.findById(otherParticipantId);

        // Check if sender has blocked the other user
        if (sender.blockedUsers && sender.blockedUsers.includes(otherParticipantId)) {
            return res.status(403).json({ msg: 'You have blocked this user.' });
        }

        // Check if receiver has blocked the sender
        if (otherParticipant.blockedUsers && otherParticipant.blockedUsers.includes(req.user.id)) {
            return res.status(403).json({ msg: 'You are blocked by this user.' });
        }

        const newMessage = {
            sender: req.user.id,
            content,
            replyTo: replyTo || null
        };

        chat.messages.push(newMessage);

        // Update lastMessage
        chat.lastMessage = {
            content,
            sender: req.user.id,
            timestamp: new Date(),
            isUnsent: false
        };

        // Update unread counts for other participants
        if (!chat.unreadCounts) {
            chat.unreadCounts = new Map();
        }

        chat.participants.forEach(participantId => {
            if (participantId.toString() !== req.user.id) {
                const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
                chat.unreadCounts.set(participantId.toString(), currentCount + 1);
            }
        });

        await chat.save();
        const savedMessage = chat.messages[chat.messages.length - 1]; // Get with ID

        res.json(savedMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST api/chat/:chatId/report
// @desc    Report a chat
// @access  Private
router.post('/:chatId/report', auth, async (req, res) => {
    const { reason } = req.body;
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // Verify participant
        if (!chat.participants.some(p => p.toString() === req.user.id)) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Identify the other user (reported user)
        const reportedUserId = chat.participants.find(p => p.toString() !== req.user.id);

        const newReport = new Report({
            reportedBy: req.user.id,
            reportedUser: reportedUserId,
            chat: chat._id,
            reportReason: reason || 'User reported this conversation'
        });

        await newReport.save();

        chat.isReported = true;
        chat.reportedBy = req.user.id;
        chat.reportReason = reason || 'User reported this conversation';
        await chat.save();

        res.json({ msg: 'Report submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/chat/:chatId/message/:messageId/unsend
// @desc    Unsend a message (Hard delete)
// @access  Private
router.put('/:chatId/message/:messageId/unsend', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        const messageIndex = chat.messages.findIndex(m => m._id.toString() === req.params.messageId);

        if (messageIndex === -1) return res.status(404).json({ msg: 'Message not found' });

        // Verify sender
        if (chat.messages[messageIndex].sender.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to unsend this message' });
        }

        // Remove message completely
        chat.messages.splice(messageIndex, 1);
        await chat.save();

        res.json(chat.messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/chat/:chatId/message/:messageId/delete
// @desc    Delete message for user (Soft delete / Hide)
// @access  Private
router.put('/:chatId/message/:messageId/delete', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        const message = chat.messages.id(req.params.messageId);
        if (!message) return res.status(404).json({ msg: 'Message not found' });

        // Add user to hiddenFor array
        if (!message.hiddenFor.includes(req.user.id)) {
            message.hiddenFor.push(req.user.id);
            await chat.save();
        }

        // Return filtered messages
        const visibleMessages = chat.messages.filter(msg =>
            !msg.hiddenFor.includes(req.user.id)
        );

        res.json(visibleMessages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/chat/:chatId/delete
// @desc    Delete chat for user (Soft delete)
// @access  Private
router.put('/:chatId/delete', auth, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // Add user to deletedBy array if not already there
        if (!chat.deletedBy.includes(req.user.id)) {
            chat.deletedBy.push(req.user.id);
            await chat.save();
        }

        res.json({ msg: 'Chat deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
