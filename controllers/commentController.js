const db = require('../config/db');
const { validationResult } = require('express-validator');

// Membuat komentar baru (harus login)
const createComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { article_id, content } = req.body;
    const user_id = req.user.id;

    try {
        const [article] = await db.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
        if (article.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Artikel tidak ditemukan' 
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Konten komentar tidak boleh kosong'
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Komentar terlalu panjang (maksimal 1000 karakter)'
            });
        }

        const [result] = await db.execute(
            'INSERT INTO comments (article_id, user_id, content) VALUES (?, ?, ?)',
            [article_id, user_id, content.trim()]
        );

        const [newComment] = await db.execute(`
            SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.status as user_status
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        const comment = {
            ...newComment[0],
            user: {
                id: user_id,
                name: newComment[0].user_name,
                avatar: newComment[0].user_avatar 
                    ? `${req.protocol}://${req.get('host')}/api/avatars/${newComment[0].user_avatar}`
                    : null,
                status: newComment[0].user_status
            }
        };

        delete comment.user_name;
        delete comment.user_avatar;
        delete comment.user_status;

        res.status(201).json({
            success: true,
            message: 'Komentar berhasil ditambahkan',
            data: comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal membuat komentar',
            error: error.message
        });
    }
};

// Mendapatkan komentar oleh artikel ID (bisa tanpa login)
const getCommentsByArticle = async (req, res) => {
    const { article_id } = req.params;

    try {
        const [article] = await db.execute('SELECT id FROM articles WHERE id = ?', [article_id]);
        if (article.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Artikel tidak ditemukan' 
            });
        }

        const [comments] = await db.execute(`
            SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.status as user_status
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.article_id = ?
            ORDER BY c.created_at DESC
        `, [article_id]);

        const formattedComments = comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            user: {
                id: comment.user_id,
                name: comment.user_name,
                avatar: comment.user_avatar 
                    ? `${req.protocol}://${req.get('host')}/api/avatars/${comment.user_avatar}`
                    : null,
                status: comment.user_status
            }
        }));

        res.status(200).json({
            success: true,
            data: formattedComments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal mengambil komentar'
        });
    }
};

// Update komentar (harus login dan pemilik komentar)
const updateComment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    try {
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Konten komentar tidak boleh kosong'
            });
        }

        // Validasi panjang content
        if (content.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Komentar terlalu panjang (maksimal 1000 karakter)'
            });
        }

        const [comment] = await db.execute(
            'SELECT * FROM comments WHERE id = ?', 
            [id]
        );
        
        if (comment.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Komentar tidak ditemukan' 
            });
        }

        if (comment[0].user_id !== user_id) {
            return res.status(403).json({ 
                success: false,
                message: 'Anda tidak memiliki akses untuk mengubah komentar ini' 
            });
        }

        const [result] = await db.execute(
            'UPDATE comments SET content = ? WHERE id = ?',
            [content.trim(), id]
        );

        const [updatedComment] = await db.execute(`
            SELECT c.*, u.name as user_name, u.avatar as user_avatar, u.status as user_status
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [id]);

        const formattedComment = {
            ...updatedComment[0],
            user: {
                id: user_id,
                name: updatedComment[0].user_name,
                avatar: updatedComment[0].user_avatar 
                    ? `${req.protocol}://${req.get('host')}/api/avatars/${updatedComment[0].user_avatar}`
                    : null,
                status: updatedComment[0].user_status
            }
        };

        delete formattedComment.user_name;
        delete formattedComment.user_avatar;
        delete formattedComment.user_status;

        res.status(200).json({
            success: true,
            message: 'Komentar berhasil diperbarui',
            data: formattedComment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal memperbarui komentar'
        });
    }
};

// Hapus komentar (harus login dan pemilik komentar)
const deleteComment = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const [comment] = await db.execute(
            'SELECT * FROM comments WHERE id = ?', 
            [id]
        );
        
        if (comment.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Komentar tidak ditemukan' 
            });
        }

        if (comment[0].user_id !== user_id) {
            return res.status(403).json({ 
                success: false,
                message: 'Anda tidak memiliki akses untuk menghapus komentar ini' 
            });
        }

        const [result] = await db.execute(
            'DELETE FROM comments WHERE id = ?', 
            [id]
        );

        res.status(200).json({ 
            success: true,
            message: 'Komentar berhasil dihapus' 
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal menghapus komentar'
        });
    }
};

module.exports = {
    createComment,
    getCommentsByArticle,
    updateComment,
    deleteComment
};