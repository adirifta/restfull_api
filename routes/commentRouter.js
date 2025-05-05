const express = require('express');
const router = express.Router();
const { 
    createComment,
    getCommentsByArticle,
    updateComment,
    deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { commentValidationRules } = require('../validators/commentValidator');


router.post('/comments', protect, commentValidationRules(), createComment);
router.get('/articles/:article_id/comments', getCommentsByArticle);
router.put('/comments/:id', protect, commentValidationRules(), updateComment);
router.delete('/comments/:id', protect, deleteComment);

module.exports = router;