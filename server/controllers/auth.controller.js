const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register new user
exports.register = async (req, res) => {
    try {
        // Log registration attempt with origin information
        console.log('Registration attempt:', { 
            name: req.body.name, 
            email: req.body.email,
            origin: req.headers.origin
        });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            console.log('Missing required fields:', { name, email, password: !!password });
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours        // Create user
        const user = await User.create({
            name,
            email,
            password,
            verificationToken,
            verificationTokenExpiry
        });

        console.log('User created successfully:', {
            userId: user._id,
            email: user.email
        });

        // Prepare verification URL
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        
        try {
            // Send verification email
            await sendEmail({
                email: user.email,
                subject: 'Emailingizni tasdiqlang',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Xush kelibsiz, ${user.name}!</h2>
                        <p>Portfoliomizda ro'yxatdan o'tganingiz uchun rahmat.</p>
                        <p>Hisobingizni faollashtirish uchun quyidagi havolani bosing:</p>
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background: #2563eb; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                                  margin: 20px 0;">
                            Emailni tasdiqlash
                        </a>
                        <p style="color: #666;">Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
                    </div>
                `
            });
            console.log('Verification email sent successfully');
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
        }

        // Check password
        console.log('Checking password for user:', email);
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
        }
        
        console.log('Login successful for user:', email);

        // Check if email is verified and include status in response
        if (!user.isEmailVerified) {
            // Generate new verification token if needed
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationToken = verificationToken;
            user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
            await user.save();

            // Send verification email
            const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
            await sendEmail({
                email: user.email,
                subject: 'Emailingizni tasdiqlang',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Xush kelibsiz, ${user.name}!</h2>
                        <p>Hisobingizni faollashtirish uchun quyidagi havolani bosing:</p>
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background: #2563eb; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                                  margin: 20px 0;">
                            Emailni tasdiqlash
                        </a>
                    </div>
                `
            });

            return res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isEmailVerified: false,
                message: 'Please verify your email. A new verification link has been sent.'
            });
        }

        // Generate token for verified user
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await sendEmail({
            email: user.email,
            subject: 'Emailingizni tasdiqlang',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Xush kelibsiz, ${user.name}!</h2>
                    <p>Hisobingizni faollashtirish uchun quyidagi havolani bosing:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: #2563eb; color: white; 
                              padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0;">
                        Emailni tasdiqlash
                    </a>
                </div>
            `
        });

        res.json({ message: 'Verification email has been resent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token: verificationCode } = req.params;

        const user = await User.findOne({
            verificationToken: verificationCode,
            verificationTokenExpiry: { $gt: Date.now() }
        });        if (!user) {
            return res.status(400).json({ 
                message: 'Tasdiqlash havolasi yaroqsiz yoki muddati tugagan. Iltimos, yangi tasdiqlash xatini so\'rang.' 
            });
        }

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // Generate auth token for auto-login
        const token = generateToken(user._id);

        res.json({ 
            message: 'Email muvaffaqiyatli tasdiqlandi!',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: true
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // Clear the cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production'
        });
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await sendEmail({
            email: user.email,
            subject: 'Password reset request',
            text: `Please click on this link to reset your password: ${resetUrl}`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Logout
exports.logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Logged out successfully' });
};

// Resend verification email
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
        await sendEmail({
            email: user.email,
            subject: 'Emailingizni tasdiqlang',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Xush kelibsiz, ${user.name}!</h2>
                    <p>Hisobingizni faollashtirish uchun quyidagi havolani bosing:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; background: #2563eb; color: white; 
                              padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                              margin: 20px 0;">
                        Emailni tasdiqlash
                    </a>
                </div>
            `
        });

        res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
