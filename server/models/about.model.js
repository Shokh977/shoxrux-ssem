const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },
    mainDescription: {
        type: String,
        required: true
    },
    mainImage: {
        type: String,
        required: true
    },
    stats: [{
        count: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        }
    }],
    features: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        }
    }],
    team: [{
        name: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        bio: String,
        social: {
            facebook: String,
            twitter: String,
            instagram: String,
            linkedin: String,
            telegram: String
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('About', aboutSchema);
