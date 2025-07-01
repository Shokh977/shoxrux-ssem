const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'topik', 'speaking', 'writing', 'other'],
        default: 'other'
    },
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    features: [{
        type: String
    }],
    outcomes: [{
        type: String
    }],
    image: {
        type: String
    },
    studentsCount: {
        type: Number,
        default: 0
    },
    lessonsCount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'draft', 'archived'],
        default: 'draft'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comments: [commentSchema],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Calculate average rating when adding a comment
courseSchema.methods.calculateRating = function() {
    if (this.comments.length === 0) {
        this.rating = 0;
        this.totalRatings = 0;
    } else {
        const totalRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
        this.rating = totalRating / this.comments.length;
        this.totalRatings = this.comments.length;
    }
};

module.exports = mongoose.model('Course', courseSchema);
