const Inquiry = require('../models/inquiry.model');

// Create new inquiry
exports.createInquiry = async (req, res) => {
    try {
        const { name, phone, university, message, type } = req.body;
        const inquiry = await Inquiry.create({
            name,
            phone,
            university,
            message,
            type
        });
        res.status(201).json(inquiry);
    } catch (error) {
        res.status(500).json({ message: 'Error creating inquiry', error: error.message });
    }
};

// Get all inquiries (admin only)
exports.getInquiries = async (req, res) => {
    try {
        const { type, status } = req.query;
        const query = {};
        
        if (type && type !== 'all') query.type = type;
        if (status && status !== 'all') query.status = status;

        const inquiries = await Inquiry.find(query)
            .sort({ createdAt: -1 });
        
        res.json(inquiries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inquiries', error: error.message });
    }
};

// Update inquiry status and notes (admin only)
exports.updateInquiry = async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const inquiry = await Inquiry.findById(req.params.id);
        
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }

        if (status) inquiry.status = status;
        if (adminNotes) inquiry.adminNotes = adminNotes;
        
        await inquiry.save();
        res.json(inquiry);
    } catch (error) {
        res.status(500).json({ message: 'Error updating inquiry', error: error.message });
    }
};

// Delete inquiry (admin only)
exports.deleteInquiry = async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
        if (!inquiry) {
            return res.status(404).json({ message: 'Inquiry not found' });
        }
        res.json({ message: 'Inquiry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inquiry', error: error.message });
    }
};
