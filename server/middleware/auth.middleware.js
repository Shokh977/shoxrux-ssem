const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.auth = async (req, res, next) => {
    try {
        // Check for token in cookies or Authorization header
        let token = req.cookies.token;
        
        // Check Authorization header if no cookie
        const authHeader = req.headers.authorization;
        if (!token && authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Convert ObjectId to string for comparison
        user._id = user._id.toString();
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

exports.adminOnly = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authorization required' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
