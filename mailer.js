const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS 
      },
    });
  }
  return transporter;
}


async function sendOtpEmail(to, otp) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEV MODE] Email not configured. OTP for ${to}: ${otp}`);
    return;
  }

  await getTransporter().sendMail({
    from: `"Student API" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your login OTP',
    text: `Your one-time password is ${otp}. It is valid for 5 minutes. Do not share it with anyone.`
  });
}

module.exports = { sendOtpEmail };
