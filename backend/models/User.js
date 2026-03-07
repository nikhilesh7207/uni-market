const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'faculty'],
        default: 'student'
    },
    profilePic: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    year: {
        type: String, // e.g., "1st Year", "2026"
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    contactPreference: {
        type: String,
        default: 'Chat Only' // Default as requested
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Password hashing middleware
// Password hashing middleware
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
