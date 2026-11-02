import express from 'express';
import {
  getAllParking,
  getParkingById,
  getParkingSlots,
  getNearbyParking,
  getParkingPrediction,
  getRecommendedParking,
  createParking,
  updateParking,
  deleteParking,
  updateSlotStatus,
  addSlotToParking,
} from '../controllers/parkingController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllParking);
router.post('/', protect, createParking);
router.get('/nearby', getNearbyParking);
router.get('/recommend', getRecommendedParking);
router.get('/:id', getParkingById);
router.put('/:id', protect, updateParking);
router.delete('/:id', protect, deleteParking);
router.get('/:id/slots', getParkingSlots);
router.post('/:id/slots', protect, addSlotToParking);
router.put('/:id/slots/:slotId', protect, updateSlotStatus);
router.get('/:id/prediction', getParkingPrediction);

export default router;


