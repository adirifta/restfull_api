const express = require('express');
const router = express.Router();
const {
    getAllUsersV2,
    getUserByIdV2,
    createUserV2,
    updateUserV2,
    deleteUserV2
} = require('../../controllers/v2/userController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { createUserValidator, updateUserValidator } = require('../../validators/userValidator');

router.get('/users', protect, authorize('admin'), getAllUsersV2);
router.post('/users', protect, authorize('admin'), createUserValidator, createUserV2);
router.delete('/users/:id', protect, authorize('admin'), deleteUserV2);

router.get('/users/:id', protect, getUserByIdV2);
router.put('/users/:id', protect, updateUserValidator, updateUserV2);

module.exports = router;