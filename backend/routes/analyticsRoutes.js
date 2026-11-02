import express from 'express';
import { getAdminAnalytics, getOwnerAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/admin', getAdminAnalytics);
router.get('/owner', getOwnerAnalytics);

export default router;
