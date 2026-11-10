// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { UnauthorizedError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'; // In production set env var

/**
 * Middleware that validates the JWT from the httpOnly cookie `token`.
 * On success it attaches `req.user` (the User document) and calls next().
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedError('Authentication required');
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) throw new UnauthorizedError('User not found');
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err instanceof UnauthorizedError) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

export function generateToken(userId) {
  const payload = { id: userId };
  // token expires in 7 days
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
