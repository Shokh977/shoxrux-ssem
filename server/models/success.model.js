const mongoose = require('mongoose');

const successStudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    social: {
        linkedin: String,
        github: String,
        telegram: String,
        instagram: String
    },
    featured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('SuccessStudent', successStudentSchema);
