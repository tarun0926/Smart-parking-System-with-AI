import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.put('/:id/status', protect, authorizeRoles('admin'), updateUserStatus);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

export default router;

