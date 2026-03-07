const mongoose = require('mongoose');

const ReportedChatSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false // Optional if chat isn't strictly tied to a product
    },
    chatHistory: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        time: Date,
        _id: mongoose.Schema.Types.ObjectId
    }],
    reportedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    }
});

module.exports = mongoose.model('ReportedChat', ReportedChatSchema);
