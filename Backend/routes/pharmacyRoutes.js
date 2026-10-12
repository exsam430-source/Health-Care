import express from 'express';
import {
  createMedicineOrder,
  getMedicineOrders,
  getMedicineOrder,
  updateMedicineOrder,
} from '../controllers/pharmacyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

router.post('/orders', protect, createMedicineOrder);
router.get('/orders', protect, getMedicineOrders);
router.get('/orders/:id', protect, getMedicineOrder);
router.put('/orders/:id', protect, authorize(USER_ROLES.PHARMACY), updateMedicineOrder);

export default router;