import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Wait for the database connection to be fully established.
 * This handles MongoMemoryServer initialization delay.
 */
const waitForDB = (timeoutMs = 15000) => {
  return new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) {
      return resolve(true);
    }
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) { resolved = true; resolve(false); }
    }, timeoutMs);
    mongoose.connection.once('connected', () => {
      if (!resolved) { resolved = true; clearTimeout(timer); resolve(true); }
    });
    const poll = setInterval(() => {
      if (mongoose.connection.readyState === 1 && !resolved) {
        resolved = true; clearTimeout(timer); clearInterval(poll); resolve(true);
      }
    }, 300);
  });
};

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'smartpark_ai_super_secret_jwt_key_2026'
      );

      // Wait for DB to be ready before querying
      const dbReady = await waitForDB(15000);
      if (!dbReady) {
        return res.status(503).json({ message: 'Database still initializing. Please try again.' });
      }

      if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return res.status(401).json({ message: 'Not authorized, invalid token payload.' });
      }

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user account not found.' });
      }

      return next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no bearer token provided.' });
  }
};

export default protect;
