const { protect, authorize } = require('../middleware/authMiddleware');
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Get all articles
const getAllArticles = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM articles');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get article by ID
const getArticleById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT a.*, u.name as author_name, u.avatar as author_avatar 
            FROM articles a
            LEFT JOIN users u ON a.author_id = u.id
            WHERE a.id = ?
        `, [id]);
        if (rows.length === 0) {
            const article = rows[0];
            article.imageUrl = article.image_url ? `${req.protocol}://${req.get('host')}/${article.image_url}` : null;
            article.author = {
                id: article.author_id,
                name: article.author_name,
                avatar: article.author_avatar ? `${req.protocol}://${req.get('host')}/${article.author_avatar}` : null
            };
            delete article.author_name;
            delete article.author_avatar;
            res.status(200).json(article);
        }
        const article = rows[0];
        // Add image URL if available
        article.imageUrl = article.image_url ? `${req.protocol}://${req.get('host')}/${article.image_url}` ?? null:
        res.status(200).json(article);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Create a new article (hanya untuk penulis)
const createArticle = async (req, res) => {
    // Validasi input
    if (!req.files || !req.files.file) {
        return res.status(400).json({ msg: "No File Uploaded" });
    }

    const { title, content } = req.body;
    
    // Validasi judul
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ msg: "Title is required" });
    }
    if (title.length > 255) {
        return res.status(400).json({ msg: "Title must be less than 255 characters" });
    }
    
    // Validasi konten
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ msg: "Content is required" });
    }
    if (content.length > 50000) {
        return res.status(400).json({ msg: "Content is too long" });
    }

    // Dapatkan user ID dari token (middleware protect)
    const authorId = req.user.id;
    
    const file = req.files.file;
    const fileSize = file.data.length;
    const ext = path.extname(file.name).toLowerCase();
    const fileName = `${file.md5}${ext}`;
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;
    const allowedTypes = ['.png', '.jpg', '.jpeg'];

    if (!allowedTypes.includes(ext)) {
        return res.status(422).json({ msg: "Invalid Image. Only PNG, JPG, and JPEG are allowed" });
    }
    if (fileSize > 5000000) {
        return res.status(422).json({ msg: "Image must be less than 5 MB" });
    }

    const validExtensions = ['.png', '.jpg', '.jpeg'];
    if (!validExtensions.includes(ext)) {
        return res.status(400).json({ msg: "Invalid file type. Only PNG, JPG, and JPEG are allowed" });
    }

    // Validasi nama file
    if (file.name.length > 100) {
        return res.status(400).json({ msg: "File name is too long" });
    }

    file.mv(`./public/images/${fileName}`, async (err) => {
        if (err) return res.status(500).json({ msg: err.message });

        try {
            const [result] = await db.execute(
                'INSERT INTO articles (title, content, author_id, image_url) VALUES (?, ?, ?, ?)',
                [title.trim(), content.trim(), authorId, `images/${fileName}`]
            );
            
            // Log activity
            console.log(`User ${authorId} created article ${result.insertId}`);
            
            res.status(201).json({ 
                msg: "Article created successfully", 
                article: {
                    id: result.insertId,
                    title: title.trim(),
                    content: content.trim(),
                    author_id: authorId,
                    imageUrl: url
                }
            });
        } catch (error) {
            console.error('Error creating article:', error);
            
            // Hapus file yang sudah diupload jika terjadi error
            fs.unlink(`./public/images/${fileName}`, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
            });
            
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });
};

// Update an article (hanya pemilik artikel atau admin)
const updateArticle = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    // Validasi input
    if (!title || title.trim().length === 0) {
        return res.status(400).json({ msg: "Title is required" });
    }
    if (title.length > 255) {
        return res.status(400).json({ msg: "Title must be less than 255 characters" });
    }
    
    if (!content || content.trim().length === 0) {
        return res.status(400).json({ msg: "Content is required" });
    }
    if (content.length > 50000) {
        return res.status(400).json({ msg: "Content is too long" });
    }

    try {
        // Cek artikel exist
        const [articleRows] = await db.execute('SELECT * FROM articles WHERE id = ?', [id]);
        if (articleRows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const article = articleRows[0];
        
        // Cek authorization (hanya penulis yang membuat artikel atau admin)
        if (article.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Not authorized to update this article' 
            });
        }

        const oldImageUrl = article.image_url;
        let imageUrl = oldImageUrl;

        if (req.files && req.files.file) {
            const file = req.files.file;
            const fileSize = file.data.length;
            const ext = path.extname(file.name).toLowerCase();
            const fileName = `${file.md5}${ext}`;
            const newUrl = `images/${fileName}`;

            // Validasi file gambar
            if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
                return res.status(422).json({ msg: "Invalid Image. Only PNG, JPG, and JPEG are allowed" });
            }
            if (fileSize > 5000000) {
                return res.status(422).json({ msg: "Image must be less than 5 MB" });
            }
            if (file.name.length > 100) {
                return res.status(400).json({ msg: "File name is too long" });
            }

            // Upload file baru
            await file.mv(`./public/${newUrl}`);
            imageUrl = newUrl;
        }

        const [result] = await db.execute(
            'UPDATE articles SET title = ?, content = ?, image_url = ? WHERE id = ?',
            [title.trim(), content.trim(), imageUrl, id]
        );

        // Hapus gambar lama jika ada gambar baru dan gambar lama ada
        if (req.files && req.files.file && oldImageUrl && imageUrl !== oldImageUrl) {
            fs.unlink(path.join(__dirname, '..', 'public', oldImageUrl), (err) => {
                if (err) console.error('Error deleting old image:', err);
            });
        }

        // Log activity
        console.log(`User ${req.user.id} updated article ${id}`);
        
        res.status(200).json({ 
            message: 'Article updated successfully',
            article: {
                id,
                title: title.trim(),
                content: content.trim(),
                imageUrl: imageUrl ? `${req.protocol}://${req.get('host')}/${imageUrl}` : null
            }
        });
    } catch (error) {
        console.error('Error updating article:', error);
        
        // Jika ada file baru yang diupload tetapi terjadi error, hapus file tersebut
        if (req.files && req.files.file && imageUrl && imageUrl !== oldImageUrl) {
            fs.unlink(path.join(__dirname, '..', 'public', imageUrl), (err) => {
                if (err) console.error('Error deleting uploaded image:', err);
            });
        }
        
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete an article (hanya pemilik artikel atau admin)
const deleteArticle = async (req, res) => {
    const { id } = req.params;
    try {
        // Cek artikel exist
        const [articleRows] = await db.execute('SELECT * FROM articles WHERE id = ?', [id]);
        if (articleRows.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const article = articleRows[0];
        
        // Cek authorization (hanya penulis yang membuat artikel atau admin)
        if (article.author_id !== req.user.id) {
            return res.status(403).json({ 
                message: 'Not authorized to delete this article' 
            });
        }

        const imageUrl = article.image_url;

        const [result] = await db.execute('DELETE FROM articles WHERE id = ?', [id]);
        
        // Hapus gambar terkait
        if (imageUrl) {
            fs.unlink(path.join(__dirname, '..', 'public', imageUrl), (err) => {
                if (err) console.error('Error deleting image:', err);
            });
        }

        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle
};