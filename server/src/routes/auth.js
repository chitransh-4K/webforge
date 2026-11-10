// src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'; // same as middleware

// Helper to send JWT in httpOnly cookie
function setTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Register
router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash });
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      res.status(201).json({ user: { email: user.email, id: user._id } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      res.json({ user: { email: user.email, id: user._id } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out' });
});

// Me – return current user (protected)
router.get('/me', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user: { email: user.email, id: user._id } });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
