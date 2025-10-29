const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const Course = require('../models/course.model');
const User = require('../models/user.model');

// Protect all routes
router.use(protect);
router.use(restrictTo('teacher', 'admin'));

// Get teacher's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ teacher: req.user._id })
            .populate('students', 'name email profilePicture');
        res.status(200).json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Get teacher's students
router.get('/students', async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id)
            .populate({
                path: 'activeStudents',
                select: 'name email profilePicture',
                populate: {
                    path: 'assignedCourses',
                    select: 'title progress'
                }
            });
        res.status(200).json(teacher.activeStudents);
    } catch (error) {
        console.error('Error fetching teacher students:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Get teacher profile
router.get('/profile', async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id)
            .select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry');
        res.status(200).json(teacher);
    } catch (error) {
        console.error('Error fetching teacher profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Update teacher profile
router.patch('/profile', async (req, res) => {
    try {
        const allowedUpdates = ['bio', 'specialization', 'teacherInfo'];
        const updates = Object.keys(req.body)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {});

        const teacher = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordExpiry');

        res.status(200).json(teacher);
    } catch (error) {
        console.error('Error updating teacher profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Add certificate
router.post('/certificates', async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id);
        teacher.teacherInfo.certificates.push(req.body);
        await teacher.save();
        res.status(201).json(teacher.teacherInfo.certificates);
    } catch (error) {
        console.error('Error adding certificate:', error);
        res.status(500).json({ message: 'Error adding certificate' });
    }
});

// Add student to teacher
router.post('/students/:studentId', async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id);
        const student = await User.findById(req.params.studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (student.role !== 'student') {
            return res.status(400).json({ message: 'User is not a student' });
        }

        if (teacher.activeStudents.includes(student._id)) {
            return res.status(400).json({ message: 'Student already assigned' });
        }

        teacher.activeStudents.push(student._id);
        await teacher.save();

        res.status(200).json({ message: 'Student added successfully' });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ message: 'Error adding student' });
    }
});

// Remove student from teacher
router.delete('/students/:studentId', async (req, res) => {
    try {
        const teacher = await User.findById(req.user._id);
        teacher.activeStudents = teacher.activeStudents.filter(
            id => id.toString() !== req.params.studentId
        );
        await teacher.save();
        res.status(200).json({ message: 'Student removed successfully' });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({ message: 'Error removing student' });
    }
});

module.exports = router;