const Course = require('../models/course.model');

// Get all courses
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('author', 'name');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Kurslarni yuklashda xatolik' });
    }
};

// Get featured courses
exports.getFeaturedCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isFeatured: true })
            .populate('author', 'name')
            .limit(6);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching featured courses:', error);
        res.status(500).json({ success: false, message: 'Kurslarni yuklashda xatolik' });
    }
};

// Get a single course
exports.getCourse = async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id)
            .populate('author', 'name')
            .populate('comments.user', 'name');

        if (!course) {
            return res.status(404).json({ success: false, message: 'Kurs topilmadi' });
        }

        // If user is not enrolled and not the author/admin, only send free content
        const isEnrolled = course.enrolledStudents.includes(req.user?._id);
        const isAuthorOrAdmin = req.user && (course.author._id.toString() === req.user._id || req.user.role === 'admin');

        if (!isEnrolled && !isAuthorOrAdmin) {
            // Filter out paid content
            course.sections = course.sections.map(section => ({
                ...section.toObject(),
                videos: section.videos.filter(video => video.isFree)
            }));
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid course ID format' });
        }
        res.status(500).json({ success: false, message: 'Kursni yuklashda xatolik' });
    }
};

// Create a course
exports.createCourse = async (req, res) => {
    try {
        const course = new Course({
            ...req.body,
            author: req.user._id
        });
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ success: false, message: 'Kursni yaratishda xatolik' });
    }
};

// Update a course
exports.updateCourse = async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({ success: false, message: 'Invalid course ID' });
        }

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Kurs topilmadi' });
        }

        // Only author or admin can update
        if (!req.user?.role === 'admin' && course.author.toString() !== req.user?._id) {
            return res.status(403).json({ success: false, message: 'Ruxsat berilmagan' });
        }

        Object.assign(course, req.body);
        await course.save();
        res.json(course);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Kursni yangilashda xatolik' });
    }
};

// Delete a course
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Kurs topilmadi' });
        }

        if (course.author.toString() !== req.user._id && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Ruxsat berilmagan' });
        }        await Course.deleteOne({ _id: course._id });
        res.json({ success: true, message: 'Kurs o\'chirildi' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ success: false, message: 'Kursni o\'chirishda xatolik' });
    }
};

// Add a comment and rating
exports.addComment = async (req, res) => {
    try {
        const { comment, rating } = req.body;
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ success: false, message: 'Kurs topilmadi' });
        }

        course.comments.push({
            user: req.user._id,
            comment,
            rating
        });

        course.calculateRating();
        await course.save();

        const updatedCourse = await Course.findById(req.params.id)
            .populate('comments.user', 'name');

        res.json(updatedCourse);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ success: false, message: 'Izoh qo\'shishda xatolik' });
    }
};

// Add or update a section
exports.updateSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const sectionData = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization
        if (course.author.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (sectionId) {
            // Update existing section
            const sectionIndex = course.sections.findIndex(s => s._id.toString() === sectionId);
            if (sectionIndex === -1) {
                return res.status(404).json({ message: 'Section not found' });
            }
            course.sections[sectionIndex] = { ...course.sections[sectionIndex].toObject(), ...sectionData };
        } else {
            // Add new section
            course.sections.push(sectionData);
        }

        // Sort sections by order
        course.sections.sort((a, b) => a.order - b.order);
        await course.save();

        res.json(course);
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ message: 'Error updating section' });
    }
};

// Add or update a video in a section
exports.updateVideo = async (req, res) => {
    try {
        const { courseId, sectionId, videoId } = req.params;
        const videoData = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization
        if (course.author.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const section = course.sections.id(sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        if (videoId) {
            // Update existing video
            const videoIndex = section.videos.findIndex(v => v._id.toString() === videoId);
            if (videoIndex === -1) {
                return res.status(404).json({ message: 'Video not found' });
            }
            section.videos[videoIndex] = { ...section.videos[videoIndex].toObject(), ...videoData };
        } else {
            // Add new video
            section.videos.push(videoData);
        }

        // Sort videos by order
        section.videos.sort((a, b) => a.order - b.order);
        await course.save();

        res.json(course);
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ message: 'Error updating video' });
    }
};

// Delete a section
exports.deleteSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization
        if (course.author.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        course.sections = course.sections.filter(section => section._id.toString() !== sectionId);
        await course.save();

        res.json({ message: 'Section deleted successfully' });
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ message: 'Error deleting section' });
    }
};

// Delete a video
exports.deleteVideo = async (req, res) => {
    try {
        const { courseId, sectionId, videoId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check authorization
        if (course.author.toString() !== req.user._id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const section = course.sections.id(sectionId);
        if (!section) {
            return res.status(404).json({ message: 'Section not found' });
        }

        section.videos = section.videos.filter(video => video._id.toString() !== videoId);
        await course.save();

        res.json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ message: 'Error deleting video' });
    }
};

// Enroll in a course
exports.enrollCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({ success: false, message: 'Kurs topilmadi' });
        }

        // Check if user is already enrolled
        if (course.enrolledStudents.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'Siz allaqachon bu kursga yozilgansiz' });
        }

        course.enrolledStudents.push(req.user._id);
        course.studentsCount = course.enrolledStudents.length;
        await course.save();

        res.json({ success: true, message: 'Kursga muvaffaqiyatli yozildingiz' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ success: false, message: 'Kursga yozilishda xatolik' });
    }
};
