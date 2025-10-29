const User = require('../models/user.model');

// Get all users (for admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry')
            .sort({ createdAt: -1 });
        
        res.status(200).json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

// Update user role
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Don't allow changing own role
        if (userId === req.user._id.toString()) {
            return res.status(403).json({ message: 'Cannot change your own role' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update role
        user.role = role;
        await user.save();

        const updatedUser = await User.findById(userId)
            .select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry');

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalUsers = await User.countDocuments();
        const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

        res.status(200).json({
            roleStats: stats,
            totalUsers,
            verifiedUsers
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ message: 'Error fetching user statistics' });
    }
};