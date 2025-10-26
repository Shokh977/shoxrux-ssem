const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir);
}

// Connect to MongoDB
connectDB();

const app = express();

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://client-dd2c.onrender.com',
    'https://shoxrux-portfolio-client.onrender.com'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Access-Control-Allow-Credentials',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400
}));

// Handle OPTIONS preflight requests
app.options('*', (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
        res.status(200).send();
    } else {
        console.warn(`Rejected CORS preflight request from origin: ${origin}`);
        res.status(403).json({ message: 'CORS not allowed for this origin' });
    }
});

// Additional headers middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
});

// Apply middleware
// Apply middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Serve static files from uploads directory with CORS
app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    // Check if file exists
    const filePath = path.join(__dirname, req.path);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
    }
    
    next();
}, express.static(path.join(__dirname, 'uploads')));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    // Serve client dist if available
    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    if (fs.existsSync(clientDist)) {
        console.log('Serving client from:', clientDist);
        app.use(express.static(clientDist, { index: false }));
    }

    // Also serve the public directory if it exists
    const publicDir = path.join(__dirname, 'public');
    if (fs.existsSync(publicDir)) {
        console.log('Serving public from:', publicDir);
        app.use(express.static(publicDir, { index: false }));
    }
}

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/blogs', require('./routes/blog.routes'));
app.use('/api/success', require('./routes/success.routes'));
app.use('/api/courses', require('./routes/course.routes'));
app.use('/api/inquiries', require('./routes/inquiry.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/about', require('./routes/about.routes'));
app.use('/api/subscribers', require('./routes/subscriber.routes'));

// After all API routes, add SPA fallback for client-side routing
app.get('*', (req, res, next) => {
    // Skip API routes and direct file requests
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
    }

    // Skip requests for specific file extensions
    if (req.path.match(/\.(js|css|ico|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/)) {
        return next();
    }

    // In production, try to serve index.html from client dist
    if (process.env.NODE_ENV === 'production') {
        const clientDist = path.join(__dirname, '..', 'client', 'dist');
        const indexPath = path.join(clientDist, 'index.html');
        
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }

    // If we're not in production or can't find index.html, send a 404
    res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Something went wrong!' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
