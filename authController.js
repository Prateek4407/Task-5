const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const { sendOtpEmail } = require('./mailer');

const SALT_ROUNDS = 10;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

/**
 * POST /auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'name, email and password are all required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ status: 'error', message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error during registration.' });
  }
}


async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'email and password are both required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    const invalidCredentialsResponse = () =>
      res.status(401).json({ status: 'error', message: 'Invalid email or password.' });

    if (!user) {
      return invalidCredentialsResponse();
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return invalidCredentialsResponse();
    }

    // Password is correct -> generate a 6-digit OTP.
    // crypto.randomInt is cryptographically secure (Math.random is not).
    const otp = String(crypto.randomInt(100000, 1000000));

    // Store only a HASH of the OTP, plus an expiry time and a fresh
    // attempts counter. Same idea as passwords: if the DB leaked, the
    // OTP itself would not be readable.
    user.otp = await bcrypt.hash(otp, SALT_ROUNDS);
    user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();

    await sendOtpEmail(user.email, otp);

    return res.status(200).json({
      status: 'success',
      message: `OTP sent to your email. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error during login.' });
  }
}


async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ status: 'error', message: 'email and otp are both required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });


    const invalidOtpResponse = () =>
      res.status(401).json({ status: 'error', message: 'Invalid or expired OTP.' });

    if (!user || !user.otp || !user.otpExpires) {
      return invalidOtpResponse();
    }

    if (user.otpExpires < new Date()) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      return invalidOtpResponse();
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otp = undefined;
      user.otpExpires = undefined;
      user.otpAttempts = 0;
      await user.save();
      return res.status(429).json({
        status: 'error',
        message: 'Too many incorrect attempts. Please log in again to get a new OTP.'
      });
    }

    const otpMatches = await bcrypt.compare(String(otp), user.otp);
    if (!otpMatches) {
      user.otpAttempts += 1;
      await user.save();
      return invalidOtpResponse();
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: 'Server error during OTP verification.' });
  }
}

module.exports = { register, login, verifyOtp };
