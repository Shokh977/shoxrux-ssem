const SuccessStudent = require('../models/success.model');

// Get all success students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await SuccessStudent.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching success students', error: error.message });
    }
};

// Get featured success students
exports.getFeaturedStudents = async (req, res) => {
    try {
        const students = await SuccessStudent.find({ featured: true }).sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching featured students', error: error.message });
    }
};

// Create new success student
exports.createStudent = async (req, res) => {
    try {
        const student = new SuccessStudent(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error creating success student', error: error.message });
    }
};

// Update success student
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await SuccessStudent.findByIdAndUpdate(id, req.body, { new: true });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error updating success student', error: error.message });
    }
};

// Delete success student
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await SuccessStudent.findByIdAndDelete(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting success student', error: error.message });
    }
};
