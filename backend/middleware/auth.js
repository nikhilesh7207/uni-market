const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    let token = req.header('x-auth-token');

    // Fallback to Authorization Bearer token header if x-auth-token is missing
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Strict Block Check: Fetch user from DB to verify status immediately
        const user = await User.findById(decoded.user?.id || decoded.id).select('isBlocked role');

        if (!user) {
            return res.status(403).json({ message: 'User not found' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact admin.' });
        }

        req.user = decoded.user || decoded; // Keep payload
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};
