const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NOTIFY_EMAIL,        // Your gmail (app password or OAuth2 recommended)
    pass: process.env.NOTIFY_EMAIL_PASS    // App password
  }
});

module.exports = transporter;
