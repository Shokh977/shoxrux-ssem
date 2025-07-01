const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],    
    coverImage: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        required: true,
        enum: ['topik', 'learning', 'university', 'culture', 'tips', 'other'],
        default: 'other'
    },    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        required: true,
        default: 'draft'
    },
    isNotification: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This will automatically handle createdAt and updatedAt
});

// Add virtual field for likes count
blogSchema.virtual('likesCount').get(function() {
    return this.likes.length;
});

// Add virtual field for comments count
blogSchema.virtual('commentsCount').get(function() {
    return this.comments.length;
});

module.exports = mongoose.model('Blog', blogSchema);
