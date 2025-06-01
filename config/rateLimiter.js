const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 1 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 3,
    message: {
        success: false,
        message: "Too many requests, please try again later."
    }
});

module.exports = limiter;