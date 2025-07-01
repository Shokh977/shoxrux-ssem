const About = require('../models/about.model');

// Get about page content
exports.getAboutContent = async (req, res) => {
    try {
        const content = await About.findOne();
        res.json(content || {});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching about content', error: error.message });
    }
};

// Update about page content
exports.updateAboutContent = async (req, res) => {
    try {
        const {
            mainTitle,
            mainDescription,
            mainImage,
            stats,
            features,
            team
        } = req.body;

        let content = await About.findOne();

        if (!content) {
            content = new About({
                mainTitle,
                mainDescription,
                mainImage,
                stats,
                features,
                team
            });
        } else {
            content.mainTitle = mainTitle;
            content.mainDescription = mainDescription;
            content.mainImage = mainImage;
            content.stats = stats;
            content.features = features;
            content.team = team;
        }

        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Error updating about content', error: error.message });
    }
};

// Update team member
exports.updateTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const update = req.body;

        const content = await About.findOne();
        if (!content) {
            return res.status(404).json({ message: 'About content not found' });
        }

        const memberIndex = content.team.findIndex(m => m._id.toString() === memberId);
        if (memberIndex === -1) {
            content.team.push(update);
        } else {
            content.team[memberIndex] = { ...content.team[memberIndex], ...update };
        }

        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Error updating team member', error: error.message });
    }
};

// Delete team member
exports.deleteTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const content = await About.findOne();

        if (!content) {
            return res.status(404).json({ message: 'About content not found' });
        }

        content.team = content.team.filter(m => m._id.toString() !== memberId);
        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team member', error: error.message });
    }
};

// Update team member
exports.updateTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const update = req.body;

        const content = await About.findOne();
        if (!content) {
            return res.status(404).json({ message: 'About content not found' });
        }

        const memberIndex = content.team.findIndex(m => m._id.toString() === memberId);
        if (memberIndex === -1) {
            content.team.push(update);
        } else {
            content.team[memberIndex] = { ...content.team[memberIndex], ...update };
        }

        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Error updating team member', error: error.message });
    }
};

// Delete team member
exports.deleteTeamMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const content = await About.findOne();

        if (!content) {
            return res.status(404).json({ message: 'About content not found' });
        }

        content.team = content.team.filter(m => m._id.toString() !== memberId);
        await content.save();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting team member', error: error.message });
    }
};
