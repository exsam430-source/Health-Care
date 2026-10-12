import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getPrescription
} from '../controllers/prescriptionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.post('/', protect, authorize(USER_ROLES.DOCTOR), createPrescription);
router.get('/', protect, getPrescriptions);
router.get('/:id', protect, getPrescription);

export default router;