const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth.middleware');
const {
    getAllStudents,
    getFeaturedStudents,
    createStudent,
    updateStudent,
    deleteStudent
} = require('../controllers/success.controller');

// Public routes
router.get('/featured', getFeaturedStudents);

// Protected routes (admin only)
router.get('/', auth, adminOnly, getAllStudents);
router.post('/', auth, adminOnly, createStudent);
router.put('/:id', auth, adminOnly, updateStudent);
router.delete('/:id', auth, adminOnly, deleteStudent);

module.exports = router;
