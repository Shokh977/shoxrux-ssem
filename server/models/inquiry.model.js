const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    university: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['trial', 'consultation', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'completed', 'rejected'],
        default: 'new'
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inquiry', inquirySchema);
