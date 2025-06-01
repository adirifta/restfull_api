const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../../controllers/v1/userController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { createUserValidator, updateUserValidator } = require('../../validators/userValidator');

router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/users', protect, authorize('admin'), createUserValidator, createUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

router.get('/users/:id', protect, getUserById);
router.put('/users/:id', protect, updateUserValidator, updateUser);

module.exports = router;