import express from 'express';
import { getAdminAnalytics, getOwnerAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/admin', protect, authorizeRoles('admin'), getAdminAnalytics);
router.get('/owner', protect, authorizeRoles('owner', 'admin'), getOwnerAnalytics);

export default router;
