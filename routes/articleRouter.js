const express = require('express');
const router = express.Router();
const {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle
} = require('../controllers/articleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/articles', getAllArticles);
router.get('/articles/:id', getArticleById);
router.post('/articles', protect, authorize('penulis', 'admin'), createArticle);
router.put('/articles/:id', protect, updateArticle);
router.delete('/articles/:id', protect, deleteArticle);
module.exports = router;