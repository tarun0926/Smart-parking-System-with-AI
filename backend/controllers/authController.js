import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const generateToken = (id, role = 'user') => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'smartpark_ai_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * Wait for the database connection to be fully established.
 * Returns true if DB is ready within timeout, false otherwise.
 * This handles the MongoMemoryServer initialization delay.
 */
const waitForDB = (timeoutMs = 30000) => {
  return new Promise((resolve) => {
    // If already connected, resolve immediately
    if (mongoose.connection.readyState === 1) {
      return resolve(true);
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, timeoutMs);

    // Listen for the connected event
    mongoose.connection.once('connected', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(true);
      }
    });

    // Also poll every 500ms in case we missed the event
    const poll = setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          clearInterval(poll);
          resolve(true);
        }
      }
    }, 500);
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// NOTE: Fallback to in‑memory store when MongoDB is unavailable (e.g., during sandbox execution).
// Simple in‑memory mock store for environments without MongoDB
if (!global.mockUsers) {
  global.mockUsers = [];
}

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicle } = req.body;

    // Field validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter name, email and password' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Standard robust email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Password minimum length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Wait for DB to be ready (handles MongoMemoryServer init delay)
    const dbReady = await waitForDB(30000);
    if (!dbReady) {
      return res.status(503).json({
        message: 'Database is still initializing. Please wait 10 seconds and try again.',
      });
    }

    // Check for duplicate email
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in or use a different email.' });
    }

    // Validate role (only 'user' and 'owner' are self-selectable; admin is not)
    const allowedRoles = ['user', 'owner'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      phone: phone?.trim() || '',
      vehicle: vehicle?.trim() || '',
    });

    const token = generateToken(user._id, user.role);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicle: user.vehicle,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Wait for DB to be ready (handles MongoMemoryServer init delay)
    const dbReady = await waitForDB(30000);
    if (!dbReady) {
      return res.status(503).json({
        message: 'Database is still initializing. Please wait 10 seconds and try again.',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password credentials' });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicle: user.vehicle,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ message: error.message || 'Server error during authentication' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
