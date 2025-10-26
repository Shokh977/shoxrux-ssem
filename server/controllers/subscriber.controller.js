const Subscriber = require('../models/subscriber.model');
const { sendEmail } = require('../utils/email');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      if (existingSubscriber.status === 'unsubscribed') {
        // Reactivate subscription
        existingSubscriber.status = 'active';
        await existingSubscriber.save();
      } else {
        return res.status(400).json({ message: 'Email is already subscribed' });
      }
    } else {
      // Create new subscriber
      await Subscriber.create({ email });
    }

    // Send welcome email with try-catch
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Shoxrux 쌤 Newsletter!',
        html: `
        <div>
          <h2>Thank you for subscribing!</h2>
          <p>You'll now receive updates about:</p>
          <ul>
            <li>New Korean language courses</li>
            <li>TOPIK preparation tips</li>
            <li>Special offers and discounts</li>
            <li>Korean culture insights</li>
          </ul>
          <p>Best regards,<br />Shoxrux 쌤 Team</p>
        </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with subscription process even if email fails
    }

    res.status(200).json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Error processing subscription' });
  }
};
        <h2>Thank you for subscribing!</h2>
        <p>You'll now receive updates about:</p>
        <ul>
          <li>New Korean language courses</li>
          <li>TOPIK preparation tips</li>
          <li>Special offers and discounts</li>
          <li>Korean culture insights</li>
        </ul>
        <p>Best regards,<br>Shoxrux 쌤 Team</p>
      `
    });

    res.status(200).json({ message: 'Successfully subscribed to the newsletter' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Error processing subscription' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    subscriber.status = 'unsubscribed';
    await subscriber.save();

    res.status(200).json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Error processing unsubscription' });
  }
};
