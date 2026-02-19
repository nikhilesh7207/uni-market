const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, required: true },
        isUnsent: { type: Boolean, default: false },
        hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        replyTo: {
            messageId: { type: mongoose.Schema.Types.ObjectId },
            content: { type: String },
            senderName: { type: String }
        },
        timestamp: { type: Date, default: Date.now }
    }],
    deletedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isReported: {
        type: Boolean,
        default: false
    },
    reportReason: {
        type: String,
        default: ''
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Optimization for Chat List
    lastMessage: {
        content: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: Date,
        isUnsent: { type: Boolean, default: false }
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
