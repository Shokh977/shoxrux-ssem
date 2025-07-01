const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth.middleware');
const Blog = require('../models/blog.model');
const {
    createBlog,
    getBlogs,
    getBlog,
    updateBlog,
    deleteBlog,
    getBlogNotifications,
    toggleLike,
    addComment,
    getComments,
    saveBlog,
    unsaveBlog,
    getSavedBlogs
} = require('../controllers/blog.controller');

// Special routes that must come before parameterized routes
router.get('/saved', auth, getSavedBlogs); // Must be before /:id to prevent conflict
router.get('/notifications', getBlogNotifications);

// Public routes for blog display
router.get('/', getBlogs); // Get all published blogs

// Blog actions (requires authentication)
router.post('/:blogId/save', auth, saveBlog);
router.delete('/:blogId/save', auth, unsaveBlog);

// Blog detail routes
router.get('/:id', getBlog);
router.get('/:id/comments', getComments);

// Admin routes for blog management
router.get('/admin/blogs', auth, adminOnly, async (req, res) => {
    try {
        const { category, status } = req.query;
        const query = {};
        
        if (category && category !== 'all') {
            query.category = category;
        }
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const blogs = await Blog.find(query)
            .populate('author', 'name email')
            .sort({ createdAt: -1 });
        
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
});

// Blog management routes (requires admin authentication)
router.post('/', auth, adminOnly, createBlog);
router.put('/:id', auth, adminOnly, updateBlog);
router.delete('/:id', auth, adminOnly, deleteBlog);
router.patch('/:id/status', auth, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('author', 'name email');
        
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog status', error: error.message });
    }
});

// Like and comment routes (requires authentication)
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comment', auth, addComment);

module.exports = router;
