const { body } = require('express-validator');

const commentValidationRules = () => {
    return [
        // Validasi untuk create dan update comment
        body('article_id')
            .notEmpty().withMessage('ID artikel harus diisi')
            .isInt().withMessage('ID artikel harus berupa angka'),
            
        body('content')
            .notEmpty().withMessage('Konten komentar harus diisi')
            .isLength({ min: 1, max: 1000 }).withMessage('Komentar harus antara 1-1000 karakter')
            .trim()
    ];
};

module.exports = {
    commentValidationRules
};