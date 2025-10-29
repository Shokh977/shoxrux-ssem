const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, getUserStats } = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Admin only routes
router.use(protect, restrictTo('admin'));

// Get all users and stats
router.get('/', getAllUsers);
router.get('/stats', getUserStats);
router.patch('/:userId/role', updateUserRole);

module.exports = router;