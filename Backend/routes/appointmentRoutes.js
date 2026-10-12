import express from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.post('/', protect, authorize(USER_ROLES.PATIENT), createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id/status', protect, authorize(USER_ROLES.DOCTOR), updateAppointmentStatus);

export default router;