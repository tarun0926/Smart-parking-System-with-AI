import express from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  getOwnerBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getAllBookings);
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/owner', protect, getOwnerBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

export default router;

