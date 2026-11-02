import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/', protect, getAllUsers);
router.put('/:id/status', protect, updateUserStatus);
router.delete('/:id', protect, deleteUser);

export default router;

