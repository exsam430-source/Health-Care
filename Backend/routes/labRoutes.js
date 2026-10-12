import express from 'express';
import {
  createLabRequest,
  getLabReports,
  getLabReport,
  updateLabReport
} from '../controllers/labController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.post('/request', protect, authorize(USER_ROLES.DOCTOR), createLabRequest);
router.get('/reports', protect, getLabReports);
router.get('/reports/:id', protect, getLabReport);
router.put('/reports/:id', protect, authorize(USER_ROLES.LABORATORY), updateLabReport);

export default router;