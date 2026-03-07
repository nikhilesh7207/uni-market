const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id || req.user._id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        console.error('Admin Auth Middleware Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
