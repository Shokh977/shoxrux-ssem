const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, getUserStats } = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Admin only routes
router.use(protect, restrictTo('admin'));

router.get('/users', getAllUsers);
router.get('/users/stats', getUserStats);
router.patch('/users/:userId/role', updateUserRole);

module.exports = router;