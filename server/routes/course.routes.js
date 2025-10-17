const express = require('express');
const { auth, adminOnly } = require('../middleware/auth.middleware');
const { 
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    addComment,
    enrollCourse,
    getFeaturedCourses,
    updateSection,
    deleteSection,
    updateVideo,
    deleteVideo
} = require('../controllers/course.controller');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/featured', getFeaturedCourses); // Add this before the :id route
router.get('/:id', getCourse);

// Protected routes
router.post('/', auth, adminOnly, createCourse);
router.put('/:id', auth, adminOnly, updateCourse);
router.delete('/:id', auth, adminOnly, deleteCourse);

// Section and video management routes
router.post('/:courseId/sections', auth, adminOnly, updateSection);
router.put('/:courseId/sections/:sectionId', auth, adminOnly, updateSection);
router.delete('/:courseId/sections/:sectionId', auth, adminOnly, deleteSection);
router.post('/:courseId/sections/:sectionId/videos', auth, adminOnly, updateVideo);
router.put('/:courseId/sections/:sectionId/videos/:videoId', auth, adminOnly, updateVideo);
router.delete('/:courseId/sections/:sectionId/videos/:videoId', auth, adminOnly, deleteVideo);

// Student routes
router.post('/:id/comments', auth, addComment);
router.post('/:id/enroll', auth, enrollCourse);

module.exports = router;
