// routes/adminRoutes.js
import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  getPendingApprovals,
  approveUser,
  rejectUser,
  toggleUserStatus,
  deleteUser,
  getAllAppointments,
  getRecentActivities
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { USER_ROLES } from '../utils/constants.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize(USER_ROLES.ADMIN));

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/recent-activities', getRecentActivities);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);
router.put('/toggle-status/:id', toggleUserStatus);

// Approval management
router.get('/pending-approvals', getPendingApprovals);
router.put('/approve/:id', approveUser);
router.put('/reject/:id', rejectUser);

// Appointments overview
router.get('/appointments', getAllAppointments);

export default router;