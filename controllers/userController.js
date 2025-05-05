const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

// Get all users (hanya admin)
const getAllUsers = async (req, res) => {
    try {
        // Cek jika user adalah admin
        if (req.user.status !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Hanya admin yang dapat mengakses daftar user' 
            });
        }

        const [rows] = await db.execute('SELECT id, name, email, bio, avatar, status, created_at FROM users');
        
        // Tambahkan avatar URL
        const usersWithAvatar = rows.map(user => ({
            ...user,
            avatar: user.avatar ? `${req.protocol}://${req.get('host')}/${user.avatar}` : null
        }));

        res.status(200).json({
            success: true,
            data: usersWithAvatar
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Get user by ID (hanya admin atau user sendiri)
const getUserById = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Cek authorization (admin atau user sendiri)
        if (req.user.id !== parseInt(id) && req.user.status !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Anda tidak memiliki akses ke data user ini' 
            });
        }

        const [rows] = await db.execute(
            'SELECT id, name, email, bio, avatar, status, created_at FROM users WHERE id = ?', 
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        const user = rows[0];
        // Add avatar URL if available
        user.avatar = user.avatar ? `${req.protocol}://${req.get('host')}/${user.avatar}` : null;
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Create a new user (hanya admin)
const createUser = async (req, res) => {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { name, email, password, bio, status = 'pembaca' } = req.body;

    // Cek jika user adalah admin
    if (req.user.status !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Hanya admin yang dapat membuat user baru' 
        });
    }

    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let avatarPath = null;
        
        if (req.files && req.files.avatar) {
            const file = req.files.avatar;
            const fileSize = file.data.length;
            const ext = path.extname(file.name);
            const fileName = `${file.md5}${ext}`;
            const allowedTypes = ['.png', '.jpg', '.jpeg'];

            if (!allowedTypes.includes(ext.toLowerCase())) {
                return res.status(422).json({ 
                    success: false,
                    message: "Format gambar tidak valid. Hanya PNG, JPG, JPEG yang diperbolehkan" 
                });
            }
            
            if (fileSize > 5000000) {
                return res.status(422).json({ 
                    success: false,
                    message: "Ukuran gambar terlalu besar. Maksimal 5MB" 
                });
            }

            await file.mv(`./public/avatars/${fileName}`);
            avatarPath = `avatars/${fileName}`;
        }

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, bio, avatar, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, bio, avatarPath, status]
        );
        
        const [newUser] = await db.execute(
            'SELECT id, name, email, bio, avatar, status FROM users WHERE id = ?',
            [result.insertId]
        );

        const user = {
            ...newUser[0],
            avatar: newUser[0].avatar ? `${req.protocol}://${req.get('host')}/${newUser[0].avatar}` : null
        };
        
        res.status(201).json({ 
            success: true,
            message: "User created successfully",
            data: user
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Update a user (hanya admin atau user sendiri)
const updateUser = async (req, res) => {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { id } = req.params;
    const { name, email, bio, status, currentPassword, newPassword } = req.body;

    try {
        // Cek authorization (admin atau user sendiri)
        if (req.user.id !== parseInt(id) && req.user.status !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Anda tidak memiliki akses untuk mengupdate user ini' 
            });
        }

        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const user = rows[0];
        const oldAvatar = user.avatar;
        let avatarPath = oldAvatar;

        // Handle avatar update
        if (req.files && req.files.avatar) {
            const file = req.files.avatar;
            const fileSize = file.data.length;
            const ext = path.extname(file.name);
            const fileName = `${file.md5}${ext}`;
            const newPath = `avatars/${fileName}`;

            if (!['.png', '.jpg', '.jpeg'].includes(ext.toLowerCase())) {
                return res.status(422).json({ 
                    success: false,
                    message: "Format gambar tidak valid. Hanya PNG, JPG, JPEG yang diperbolehkan" 
                });
            }
            
            if (fileSize > 5000000) {
                return res.status(422).json({ 
                    success: false,
                    message: "Ukuran gambar terlalu besar. Maksimal 5MB" 
                });
            }

            await file.mv(`./public/${newPath}`);
            avatarPath = newPath;

            // Delete old avatar if it exists
            if (oldAvatar) {
                fs.unlink(path.join(__dirname, '..', 'public', oldAvatar), (err) => {
                    if (err) console.error('Error deleting old avatar:', err);
                });
            }
        }

        // Handle password update
        let hashedPassword = user.password;
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Password saat ini harus dimasukkan untuk mengubah password' 
                });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Password saat ini salah' 
                });
            }

            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(newPassword, salt);
        }

        // Hanya admin yang bisa mengubah status
        const newStatus = req.user.status === 'admin' ? (status || user.status) : user.status;

        const [result] = await db.execute(
            'UPDATE users SET name = ?, email = ?, password = ?, bio = ?, avatar = ?, status = ? WHERE id = ?',
            [name || user.name, email || user.email, hashedPassword, bio || user.bio, avatarPath, newStatus, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const [updatedUser] = await db.execute(
            'SELECT id, name, email, bio, avatar, status FROM users WHERE id = ?',
            [id]
        );

        res.status(200).json({ 
            success: true,
            message: 'User updated successfully',
            data: {
                ...updatedUser[0],
                avatar: updatedUser[0].avatar ? `${req.protocol}://${req.get('host')}/${updatedUser[0].avatar}` : null
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Delete a user (hanya admin)
const deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Cek jika user adalah admin
        if (req.user.status !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Hanya admin yang dapat menghapus user' 
            });
        }

        // First check if user exists
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (userRows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Check if user has articles
        const [articleRows] = await db.execute('SELECT * FROM articles WHERE author_id = ?', [id]);
        if (articleRows.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Tidak dapat menghapus user yang memiliki artikel. Hapus artikel terlebih dahulu.' 
            });
        }

        const avatarPath = userRows[0].avatar;

        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        if (avatarPath) {
            fs.unlink(path.join(__dirname, '..', 'public', avatarPath), (err) => {
                if (err) console.error('Error deleting avatar:', err);
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};