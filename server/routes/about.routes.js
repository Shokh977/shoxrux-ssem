const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth.middleware');
const {
    getAboutContent,
    updateAboutContent,
    updateTeamMember,
    deleteTeamMember
} = require('../controllers/about.controller');

// Public route to get about page content
router.get('/', getAboutContent);

// Protected admin routes
router.put('/', auth, adminOnly, updateAboutContent);
router.put('/team/:memberId', auth, adminOnly, updateTeamMember);
router.delete('/team/:memberId', auth, adminOnly, deleteTeamMember);

module.exports = router;
