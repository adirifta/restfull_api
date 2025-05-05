const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            const [rows] = await db.execute('SELECT id, name, email, status FROM users WHERE id = ?', [decoded.id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            req.user = rows[0];
            next();
        } catch (error) {
            console.error('Error in protect middleware:', error);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.status)) {
            return res.status(403).json({ 
                message: `User with status ${req.user.status} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };