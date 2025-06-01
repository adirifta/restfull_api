const callInternalAPI = require('../services/internalRequest');
const pool = require('../config/db');

const createOrder = async (req, res) => {
    const { userId, productId } = req.body;

    try {
        // 1. Internal request ke user service
        const user = await callInternalAPI('GET', `/api/v2/users/${userId}`, {}, {
            Authorization: req.headers.authorization,
        });

        if (!user.success) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Buat order
        const [result] = await pool.query(
            'INSERT INTO orders (user_id, product_id) VALUES (?, ?)',
            [userId, productId]
        );

        // 3. Gabungkan data user dan order
        res.status(201).json({
            success: true,
            data: {
                orderId: result.insertId,
                user: user.data,
                productId,
            },
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createOrder };