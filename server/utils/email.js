const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    console.log('Attempting to send email to:', options.email);
      // Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true for port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });try {
        // Define email options
        const mailOptions = {
            from: `"Shoxrux Korean" <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

module.exports = sendEmail;
