const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { validationResult } = require('express-validator');

// Register a new user
const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { name, email, password, bio, status = 'pembaca' } = req.body;

    try {
        // Check if email already exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

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
                    message: 'Format gambar tidak valid. Hanya PNG, JPG, JPEG yang diperbolehkan' 
                });
            }
            
            if (fileSize > 5000000) {
                return res.status(422).json({ 
                    success: false,
                    message: 'Ukuran gambar terlalu besar. Maksimal 5MB' 
                });
            }

            await file.mv(`./public/avatars/${fileName}`);
            avatarPath = `avatars/${fileName}`;
        }

        // Create user
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
            message: 'User registered successfully',
            data: user
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Login user
const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    const { email, password } = req.body;

    try {
        // Cek apakah user ada
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: 'Email atau password salah' 
            });
        }

        const user = rows[0];

        // Bandingkan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Email atau password salah' 
            });
        }

        // Buat token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                status: user.status 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Hapus password dari data user sebelum dikirim ke client
        const { password: _, ...userWithoutPassword } = user;

        // Response sukses dengan token
        res.status(200).json({
            success: true,
            message: 'Login berhasil',
            token,
            data: {
                ...userWithoutPassword,
                avatar: user.avatar ? `${req.protocol}://${req.get('host')}/${user.avatar}` : null
            }
        });

    } catch (error) {
        console.error('Error saat login:', error);
        res.status(500).json({ 
            success: false,
            message: 'Terjadi kesalahan server' 
        });
    }
};

// Get current user profile
const getMe = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, bio, avatar, status FROM users WHERE id = ?', 
            [req.user.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const user = rows[0];
        user.avatar = user.avatar ? `${req.protocol}://${req.get('host')}/${user.avatar}` : null;

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};