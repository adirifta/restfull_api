const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [user] = await pool.query('SELECT id, name, email, status FROM users WHERE id = ?', [decoded.id]);
        
        if (!user.length) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        req.user = user[0];
        next();
    } catch (error) {
        console.error('JWT Error:', error);
        res.status(401).json({ 
            success: false,
            message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' 
        });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.status)) {
        return res.status(403).json({ 
            success: false,
            message: 'Unauthorized access' 
        });
    }
    next();
};

module.exports = { protect, authorize };