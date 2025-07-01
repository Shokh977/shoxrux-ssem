const Blog = require('../models/blog.model');
const User = require('../models/user.model');

// Create a new blog post
exports.createBlog = async (req, res) => {
    try {
        const { 
            title, 
            content, 
            excerpt, 
            tags, 
            coverImage, 
            isNotification,
            category 
        } = req.body;
        
        const blog = await Blog.create({
            title,
            content,
            excerpt,
            tags: tags || [],
            coverImage,
            author: req.user._id,
            isNotification,
            category,
            createdAt: new Date(),
            status: 'published'
        });

        // Populate the author details before sending response
        await blog.populate('author', 'name email profilePicture');

        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error creating blog post', error: error.message });
    }
};

// Get all blog posts
exports.getBlogs = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { status: 'published' };
        
        if (category && category !== 'all') {
            query.category = category;
        }

        const blogs = await Blog.find(query)
            .populate('author', 'name email profilePicture')
            .sort({ 
                isNotification: -1,  // Sort notifications first
                createdAt: -1        // Then by creation date
            });
        
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
};

// Get blog notifications
exports.getBlogNotifications = async (req, res) => {
    try {
        const notifications = await Blog.find({ 
            status: 'published',
            isNotification: true 
        })
        .populate('author', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .limit(10);
        
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// Get single blog post
exports.getBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('author', 'name');
        
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Increment view count
        blog.viewCount += 1;
        await blog.save();
        
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching blog', error: error.message });
    }
};

// Update blog post
exports.updateBlog = async (req, res) => {
    try {
        const { title, content, excerpt, tags, coverImage, status, isNotification } = req.body;
        
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user is author or admin
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.excerpt = excerpt || blog.excerpt;
        blog.tags = tags || blog.tags;
        blog.coverImage = coverImage || blog.coverImage;
        blog.status = status || blog.status;
        blog.isNotification = isNotification !== undefined ? isNotification : blog.isNotification;

        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    }
};

// Delete blog post
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }        // Check if user is author or admin
        if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Blog.deleteOne({ _id: req.params.id });
        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
};

// Like or unlike a blog post
exports.toggleLike = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const userIndex = blog.likes.indexOf(req.user._id);
        if (userIndex === -1) {
            // Like the post
            blog.likes.push(req.user._id);
        } else {
            // Unlike the post
            blog.likes.splice(userIndex, 1);
        }

        await blog.save();
        res.json({ 
            likes: blog.likes.length,
            isLiked: userIndex === -1 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling like', error: error.message });
    }
};

// Add a comment to a blog post
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.comments.push({
            content,
            author: req.user._id
        });

        await blog.save();
        
        // Populate the author details of the new comment
        const populatedBlog = await Blog.findById(blog._id)
            .populate('comments.author', 'name email profilePicture');

        const newComment = populatedBlog.comments[populatedBlog.comments.length - 1];
        
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

// Get comments for a blog post
exports.getComments = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate('comments.author', 'name email profilePicture')
            .select('comments');

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json(blog.comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

// Get saved blogs for current user
exports.getSavedBlogs = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the user first
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all blogs that are in the user's savedBlogs array
        const savedBlogs = await Blog.find({
            _id: { $in: user.savedBlogs || [] }
        }).populate('author', 'name email profilePicture');

        res.json(savedBlogs);
    } catch (error) {
        console.error('Error in getSavedBlogs:', error);
        res.status(500).json({ 
            message: 'Error fetching saved blogs', 
            error: error.message 
        });
    }
};

// Save a blog
exports.saveBlog = async (req, res) => {
    try {
        const { blogId } = req.params;
        const userId = req.user._id;

        // Check if blog exists
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Update user's saved blogs
        const user = await User.findById(userId);
        const isSaved = user.savedBlogs.includes(blogId);

        if (isSaved) {
            return res.json({ isSaved: true });
        }

        user.savedBlogs.push(blogId);
        await user.save();

        res.json({ isSaved: true });
    } catch (error) {
        console.error('Error in saveBlog:', error);
        res.status(500).json({ message: 'Error saving blog', error: error.message });
    }
};

// Unsave a blog
exports.unsaveBlog = async (req, res) => {
    try {
        const { blogId } = req.params;
        const userId = req.user._id;

        // Update user's saved blogs
        const user = await User.findById(userId);
        user.savedBlogs = user.savedBlogs.filter(id => id.toString() !== blogId);
        await user.save();

        res.json({ isSaved: false });
    } catch (error) {
        console.error('Error in unsaveBlog:', error);
        res.status(500).json({ message: 'Error unsaving blog', error: error.message });
    }
};
