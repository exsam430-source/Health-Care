import express from 'express';
import { register, login, getMe, getDoctors, getLaboratories, getPharmacies } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/doctors', protect, getDoctors);
router.get('/laboratories', protect, getLaboratories);
router.get('/pharmacies', protect, getPharmacies);

export default router;