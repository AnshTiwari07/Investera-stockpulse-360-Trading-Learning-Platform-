const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'profile-pics'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// Nodemailer transporter (optional): configure via env
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', upload.single('profilePic'), async (req, res) => {
  const { firstName, lastName, email, password, phone, panCard } = req.body;
  const profilePic = req.file ? `/uploads/profile-pics/${req.file.filename}` : undefined;

  // Basic password complexity check
  const pwdRegex = /(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/;
  if (!pwdRegex.test(password)) {
    return res.status(400).json({ msg: 'Password must be at least 8 characters and include upper/lower case, number and symbol' });
  }

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Create new user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phone,
      panCard,
      profilePic,
      verificationToken
    });

    await user.save();

    // Send verification email (if transporter configured)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/verify?token=${verificationToken}&id=${user.id}`;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Please verify your email',
          text: `Click to verify: ${verifyUrl}`,
          html: `<p>Click to verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
        });
      } catch (mailErr) {
        console.error('Email send error', mailErr.message);
      }
    } else {
      console.log('Verification URL (no SMTP configured):', verifyUrl);
    }

    // Create JWT payload (still sign a token so client can be logged in)
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5 days' }, (err, token) => {
      if (err) throw err;
      res.json({ token, msg: 'Registration successful. Please verify your email.' });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET api/auth/verify
// Verify email token
router.get('/verify', async (req, res) => {
  const { token, id } = req.query;
  if (!token || !id) return res.status(400).send('Invalid verification link');
  try {
    const user = await User.findOne({ _id: id, verificationToken: token });
    if (!user) return res.status(400).send('Invalid or expired token');
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return res.json({ msg: 'Email verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password, termsAccepted } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Require email verification before allowing login
    if (!user.emailVerified) {
      return res.status(401).json({ msg: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
    }

    // Require acceptance of Terms & Conditions
    if (!termsAccepted) {
      return res.status(400).json({ msg: 'Terms & Conditions must be accepted', code: 'TERMS_NOT_ACCEPTED' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id
      }
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/resend
// @desc    Resend verification email
// @access  Public
router.post('/resend', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ msg: 'Email already verified' });

    user.verificationToken = crypto.randomBytes(20).toString('hex');
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/verify?token=${user.verificationToken}&id=${user.id}`;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@example.com',
          to: user.email,
          subject: 'Please verify your email',
          text: `Click to verify: ${verifyUrl}`,
          html: `<p>Click to verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
        });
      } catch (mailErr) {
        console.error('Email send error', mailErr.message);
      }
    } else {
      console.log('Verification URL (no SMTP configured):', verifyUrl);
    }

    return res.json({ msg: 'Verification email resent' });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
