const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Strict Block Check: Fetch user from DB to verify status immediately
        const user = await User.findById(decoded.user.id).select('isBlocked role');

        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ msg: 'Your account has been suspended. Please contact admin.' });
        }

        req.user = decoded.user; // Keep payload (id)
        // Optional: req.user.role = user.role; // Refresh role if needed
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
