const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

exports.uploadImage = (req, res) => {
    const uploadSingle = upload.single('image');

    uploadSingle(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                message: 'File upload error',
                error: err.message
            });
        } else if (err) {
            return res.status(400).json({
                message: 'Invalid file type or other error',
                error: err.message
            });
        }

        // File upload successful
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
        
        res.json({
            message: 'File uploaded successfully',
            url: fileUrl
        });
    });
};
