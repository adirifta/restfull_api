const { body } = require('express-validator');

const registerValidator = [
    body('name')
        .notEmpty().withMessage('Nama harus diisi')
        .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter')
        .trim(),
    
    body('email')
        .notEmpty().withMessage('Email harus diisi')
        .isEmail().withMessage('Email tidak valid')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password harus diisi')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
        .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf besar')
        .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka'),
    
    body('bio')
        .optional()
        .isLength({ max: 500 }).withMessage('Bio maksimal 500 karakter'),
    
    body('status')
        .optional()
        .isIn(['penulis', 'pembaca']).withMessage('Status harus penulis atau pembaca')
];

const loginValidator = [
    body('email')
        .notEmpty().withMessage('Email harus diisi')
        .isEmail().withMessage('Email tidak valid')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password harus diisi')
];

module.exports = {
    registerValidator,
    loginValidator
};