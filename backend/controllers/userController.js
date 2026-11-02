import mongoose from 'mongoose';
import User from '../models/User.js';

// @desc    Get current logged in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(req.user._id)) {
      const user = await User.findById(req.user._id);
      if (user) {
        return res.json({
          success: true,
          user: {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            vehicle: user.vehicle,
            createdAt: user.createdAt,
          },
        });
      }
    }

    // Fallback: return from decoded token / middleware-attached user
    return res.json({
      success: true,
      user: {
        _id: req.user._id || req.user.id,
        id: req.user._id || req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone || '',
        vehicle: req.user.vehicle || '',
      },
    });
  } catch (error) {
    console.error('[Get Profile Error]:', error);
    res.status(500).json({ message: 'Error retrieving user profile' });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(req.user._id)) {
      const user = await User.findById(req.user._id);

      if (user) {
        if (req.body.name) user.name = req.body.name.trim();
        if (req.body.email) {
          const normEmail = req.body.email.trim().toLowerCase();
          if (normEmail !== user.email) {
            const emailInUse = await User.findOne({ email: normEmail, _id: { $ne: user._id } });
            if (emailInUse) {
              return res.status(400).json({ message: 'Email address is already in use by another account.' });
            }
            user.email = normEmail;
          }
        }
        if (req.body.phone !== undefined) user.phone = req.body.phone.trim();
        if (req.body.vehicle !== undefined) user.vehicle = req.body.vehicle.trim();

        if (req.body.password && req.body.password.length >= 6) {
          user.password = req.body.password;
        }

        const updatedUser = await user.save();

        return res.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
            _id: updatedUser._id,
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            vehicle: updatedUser.vehicle,
          },
        });
      }
    }

    // Fallback: acknowledge the update without DB
    return res.json({
      success: true,
      message: 'Profile updated (fallback mode)',
      user: {
        _id: req.user._id || req.user.id,
        id: req.user._id || req.user.id,
        name: req.body.name || req.user.name,
        email: req.body.email || req.user.email,
        role: req.user.role,
        phone: req.body.phone || req.user.phone || '',
        vehicle: req.body.vehicle || req.user.vehicle || '',
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

// In-memory user management fallback store
let mockUsersAdminStore = [
  { id: 'u1', name: 'Rohan Sharma', email: 'rohan.sharma@example.com', role: 'Driver', phone: '+91 98450 12345', vehicle: 'KA-05-EV-4092', status: 'Active' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.j@parkingsolutions.com', role: 'Owner', phone: '+91 99887 76655', vehicle: 'KA-01-AB-1234', status: 'Active' },
  { id: 'u3', name: 'Priya Iyer', email: 'priya.iyer@example.com', role: 'Driver', phone: '+91 97654 32109', vehicle: 'MH-02-CD-5678', status: 'Active' },
  { id: 'u4', name: 'System Admin', email: 'admin@smartpark.ai', role: 'Admin', phone: '+91 98765 43210', vehicle: 'DL-01-XY-9999', status: 'Active' },
];

// @desc    Get all registered platform users (Admin feature)
// @route   GET /api/users
// @access  Public / Admin
export const getAllUsers = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
      if (users.length > 0) {
        return res.json({
          success: true,
          count: users.length,
          data: users.map((u) => ({
            ...u,
            id: u._id,
            role: u.role === 'user' ? 'Driver' : u.role === 'owner' ? 'Owner' : 'Admin',
            status: u.status || 'Active',
          })),
        });
      }
    }

    // Fallback users
    return res.json({
      success: true,
      count: mockUsersAdminStore.length,
      data: mockUsersAdminStore,
    });
  } catch (error) {
    console.error('[Get All Users Error]:', error);
    res.status(500).json({ success: false, message: 'Error retrieving user list' });
  }
};

// @desc    Update user status / role (Admin feature)
// @route   PUT /api/users/:id/status
// @access  Private / Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (status) user.status = status;
      if (role) user.role = role.toLowerCase() === 'driver' ? 'user' : role.toLowerCase();
      await user.save();

      return res.json({
        success: true,
        message: `User ${user.name} status updated to ${status || user.status}`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role === 'user' ? 'Driver' : user.role === 'owner' ? 'Owner' : 'Admin',
          status: user.status || 'Active',
        },
      });
    }

    // Fallback store update
    const userIdx = mockUsersAdminStore.findIndex((u) => u.id === id);
    if (userIdx !== -1) {
      if (status) mockUsersAdminStore[userIdx].status = status;
      if (role) mockUsersAdminStore[userIdx].role = role;
      return res.json({
        success: true,
        message: `User ${mockUsersAdminStore[userIdx].name} status updated`,
        data: mockUsersAdminStore[userIdx],
      });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('[Update User Status Error]:', error);
    res.status(500).json({ message: 'Error updating user status' });
  }
};

// @desc    Delete user account (Admin feature)
// @route   DELETE /api/users/:id
// @access  Private / Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findByIdAndDelete(id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      return res.json({
        success: true,
        message: `User ${user.name} removed successfully`,
        data: { id },
      });
    }

    // Fallback store
    const initialLen = mockUsersAdminStore.length;
    mockUsersAdminStore = mockUsersAdminStore.filter((u) => u.id !== id);
    if (mockUsersAdminStore.length < initialLen) {
      return res.json({
        success: true,
        message: 'User removed successfully',
        data: { id },
      });
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('[Delete User Error]:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

