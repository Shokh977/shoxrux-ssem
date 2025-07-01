require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

const makeAdmin = async (email) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find user and update role
        const user = await User.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        );

        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        console.log(`Successfully made ${user.name} (${user.email}) an admin`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.log('Please provide an email address');
    process.exit(1);
}

makeAdmin(email);
