const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit for upload
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Error: Images Only!'));
    }
});

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    console.log('[REGISTER] req.body:', req.body);
    // Ignore any 'role' provided in the request body to prevent privilege escalation
    const { name, email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create user with explicit default role
        user = new User({
            name,
            email,
            password,
            role: 'student' // Hardcode to prevent role injection vulnerability
        });

        // Password hashing handled in User model pre-save

        await user.save();

        // Return JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            // Mongoose validation error (e.g. email match failed)
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    console.log('[LOGIN] req.body:', req.body);
    const { email, password } = req.body;

    try {
        // Check user
        let user = await User.findOne({ email });
        if (!user) {
            console.log('[LOGIN] No user found for email:', email);
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ msg: 'Your account has been suspended. Please contact admin.' });
        }

        // Match password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/user (alias: /me)
// @desc    Get user data
// @access  Private
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user._id).select('-password');
        res.json({ user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
router.get('/user', auth, getUser);
router.get('/me', auth, getUser);

// @route   GET api/auth/profile/:id
// @desc    Get public user profile
// @access  Public
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    const { name, department, year, bio, contactPreference } = req.body;
    const profileFields = {};
    if (name) profileFields.name = name;
    if (department) profileFields.department = department;
    if (year) profileFields.year = year;
    if (bio) profileFields.bio = bio;
    if (contactPreference) profileFields.contactPreference = contactPreference;

    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: profileFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/upload-profile-pic
// @desc    Upload profile picture
// @access  Private
router.post('/upload-profile-pic', auth, upload.single('profilePic'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        // Convert file buffer to Base64 string
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.profilePic = base64Image;
        await user.save();

        res.json({ profilePic: base64Image });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/block-user/:id
// @desc    Block or Unblock a user
// @access  Private
router.post('/block-user/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetUserId = req.params.id;

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.blockedUsers.includes(targetUserId)) {
            // Unblock
            user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
            await user.save();
            return res.json({ msg: 'User unblocked', isBlocked: false });
        } else {
            // Block
            user.blockedUsers.push(targetUserId);
            await user.save();
            return res.json({ msg: 'User blocked', isBlocked: true });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/auth/profile-pic
// @desc    Delete/Remove profile picture
// @access  Private
router.delete('/profile-pic', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.profilePic = '';
        await user.save();

        res.json({ msg: 'Profile picture removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
