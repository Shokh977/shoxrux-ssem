const express = require('express');
const { auth, adminOnly } = require('../middleware/auth.middleware');
const { 
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    addComment,
    enrollCourse
} = require('../controllers/course.controller');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', auth, adminOnly, createCourse);
router.put('/:id', auth, adminOnly, updateCourse);
router.delete('/:id', auth, adminOnly, deleteCourse);

// Student routes
router.post('/:id/comments', auth, addComment);
router.post('/:id/enroll', auth, enrollCourse);

module.exports = router;
