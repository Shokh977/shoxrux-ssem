const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth.middleware');
const {
    createInquiry,
    getInquiries,
    updateInquiry,
    deleteInquiry
} = require('../controllers/inquiry.controller');

// Public route for creating inquiries
router.post('/', createInquiry);

// Admin routes
router.get('/', auth, adminOnly, getInquiries);
router.put('/:id', auth, adminOnly, updateInquiry);
router.delete('/:id', auth, adminOnly, deleteInquiry);

module.exports = router;
