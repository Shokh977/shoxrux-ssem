const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth.middleware');
const { uploadImage } = require('../controllers/upload.controller');

// Upload route (requires admin authentication)
router.post('/image', auth, adminOnly, uploadImage);

module.exports = router;
