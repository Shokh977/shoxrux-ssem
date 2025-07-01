const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user.model');
const { auth } = require('../middleware/auth.middleware');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profiles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Routes
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            data: {
                name: user.name,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.file) {
            if (user.profilePicture) {
                const oldPath = path.join(__dirname, '..', user.profilePicture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            user.profilePicture = `/uploads/profiles/${req.file.filename}`;
        }

        await user.save();
        res.json({
            success: true,
            data: {
                name: user.name,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ success: false, message: 'Error updating profile picture' });
    }
});

router.put('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.body.name) {
            user.name = req.body.name;
        }

        await user.save();
        res.json({
            success: true,
            data: {
                name: user.name,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

module.exports = router;
