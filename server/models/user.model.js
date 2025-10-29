const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    bio: {
        type: String,
        default: ''
    },
    specialization: {
        type: String,
        default: ''
    },
    teacherInfo: {
        qualifications: [{
            type: String
        }],
        experience: {
            type: Number,
            default: 0
        },
        languages: [{
            type: String
        }],
        certificates: [{
            name: String,
            issuer: String,
            date: Date,
            file: String
        }]
    },
    assignedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    activeStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    profilePicture: {
        type: String,
        default: ''
    },
    savedBlogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

const User = mongoose.model('User', userSchema);
module.exports = User;
