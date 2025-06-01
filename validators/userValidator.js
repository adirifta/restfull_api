const { body, validationResult } = require('express-validator');

const createUserValidator = [
    body('name')
        .notEmpty().withMessage('Nama harus diisi')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    
    body('email')
        .notEmpty().withMessage('Email harus diisi')
        .isEmail().withMessage('Email tidak valid'),
    
    body('password')
        .notEmpty().withMessage('Password harus diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    
    body('status')
        .optional()
        .isIn(['penulis', 'pembaca']).withMessage('Status harus penulis atau pembaca'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

const updateUserValidator = [
    body('name')
        .optional()
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
    
    body('email')
        .optional()
        .isEmail().withMessage('Email tidak valid'),
    
    body('newPassword')
        .optional()
        .isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
    
    body('status')
        .optional()
        .isIn(['penulis', 'pembaca']).withMessage('Status harus penulis atau pembaca')
];

module.exports = {
    createUserValidator,
    updateUserValidator
};