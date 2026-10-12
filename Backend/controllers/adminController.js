// controllers/adminController.js
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import MedicineOrder from '../models/Medicine.js';
import { USER_ROLES, APPROVAL_STATUS } from '../utils/constants.js';

// @desc Get dashboard statistics
// @route GET /api/admin/dashboard
// @access Private (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    // User counts by role
    const totalPatients = await User.countDocuments({ role: USER_ROLES.PATIENT });
    const totalDoctors = await User.countDocuments({ role: USER_ROLES.DOCTOR });
    const totalLaboratories = await User.countDocuments({ role: USER_ROLES.LABORATORY });
    const totalPharmacies = await User.countDocuments({ role: USER_ROLES.PHARMACY });
    const totalUsers = totalPatients + totalDoctors + totalLaboratories + totalPharmacies;

    // Pending approvals
    const pendingDoctors = await User.countDocuments({ 
      role: USER_ROLES.DOCTOR, 
      approvalStatus: APPROVAL_STATUS.PENDING 
    });
    const pendingLaboratories = await User.countDocuments({ 
      role: USER_ROLES.LABORATORY, 
      approvalStatus: APPROVAL_STATUS.PENDING 
    });
    const pendingPharmacies = await User.countDocuments({ 
      role: USER_ROLES.PHARMACY, 
      approvalStatus: APPROVAL_STATUS.PENDING 
    });
    const totalPendingApprovals = pendingDoctors + pendingLaboratories + pendingPharmacies;

    // Approved counts
    const approvedDoctors = await User.countDocuments({ 
      role: USER_ROLES.DOCTOR, 
      approvalStatus: APPROVAL_STATUS.APPROVED 
    });
    const approvedLaboratories = await User.countDocuments({ 
      role: USER_ROLES.LABORATORY, 
      approvalStatus: APPROVAL_STATUS.APPROVED 
    });
    const approvedPharmacies = await User.countDocuments({ 
      role: USER_ROLES.PHARMACY, 
      approvalStatus: APPROVAL_STATUS.APPROVED 
    });

    // Active users
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Appointment statistics
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

    // Prescription statistics
    const totalPrescriptions = await Prescription.countDocuments();

    // Lab report statistics
    const totalLabReports = await LabReport.countDocuments();
    const pendingLabReports = await LabReport.countDocuments({ status: 'requested' });

    // Medicine order statistics
    const totalMedicineOrders = await MedicineOrder.countDocuments();
    const pendingMedicineOrders = await MedicineOrder.countDocuments({ status: 'pending' });

    // Recent registrations (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentRegistrations = await User.countDocuments({ 
      createdAt: { $gte: lastWeek } 
    });

    // Monthly registration stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Role distribution for chart
    const roleDistribution = [
      { role: 'Patients', count: totalPatients },
      { role: 'Doctors', count: totalDoctors },
      { role: 'Laboratories', count: totalLaboratories },
      { role: 'Pharmacies', count: totalPharmacies }
    ];

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalLaboratories,
          totalPharmacies,
          activeUsers,
          inactiveUsers
        },
        approvals: {
          totalPendingApprovals,
          pendingDoctors,
          pendingLaboratories,
          pendingPharmacies,
          approvedDoctors,
          approvedLaboratories,
          approvedPharmacies
        },
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          completed: completedAppointments
        },
        prescriptions: {
          total: totalPrescriptions
        },
        labReports: {
          total: totalLabReports,
          pending: pendingLabReports
        },
        medicineOrders: {
          total: totalMedicineOrders,
          pending: pendingMedicineOrders
        },
        recentActivity: {
          recentRegistrations
        },
        charts: {
          monthlyStats,
          roleDistribution
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// @desc Get all users with filtering and pagination
// @route GET /api/admin/users
// @access Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      approvalStatus, 
      isActive, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { role: { $ne: USER_ROLES.ADMIN } }; // Exclude admin users

    // Apply filters
    if (role) {
      query.role = role;
    }
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(query)
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// @desc Get single user details
// @route GET /api/admin/users/:id
// @access Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('approvedBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats based on role
    let additionalStats = {};
    
    if (user.role === USER_ROLES.DOCTOR) {
      additionalStats.totalAppointments = await Appointment.countDocuments({ doctor: user._id });
      additionalStats.completedAppointments = await Appointment.countDocuments({ 
        doctor: user._id, 
        status: 'completed' 
      });
      additionalStats.totalPrescriptions = await Prescription.countDocuments({ doctor: user._id });
    } else if (user.role === USER_ROLES.PATIENT) {
      additionalStats.totalAppointments = await Appointment.countDocuments({ patient: user._id });
      additionalStats.totalPrescriptions = await Prescription.countDocuments({ patient: user._id });
    } else if (user.role === USER_ROLES.LABORATORY) {
      additionalStats.totalReports = await LabReport.countDocuments({ laboratory: user._id });
      additionalStats.completedReports = await LabReport.countDocuments({ 
        laboratory: user._id, 
        status: 'completed' 
      });
    } else if (user.role === USER_ROLES.PHARMACY) {
      additionalStats.totalOrders = await MedicineOrder.countDocuments({ pharmacy: user._id });
      additionalStats.deliveredOrders = await MedicineOrder.countDocuments({ 
        pharmacy: user._id, 
        status: 'delivered' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        stats: additionalStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// @desc Get pending approvals
// @route GET /api/admin/pending-approvals
// @access Private (Admin)
export const getPendingApprovals = async (req, res) => {
  try {
    const { role } = req.query;

    let query = { 
      approvalStatus: APPROVAL_STATUS.PENDING,
      role: { $in: [USER_ROLES.DOCTOR, USER_ROLES.LABORATORY, USER_ROLES.PHARMACY] }
    };

    if (role) {
      query.role = role;
    }

    const pendingUsers = await User.find(query)
      .select('-password')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};

// @desc Approve user (doctor, lab, pharmacy)
// @route PUT /api/admin/approve/:id
// @access Private (Admin)
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === USER_ROLES.PATIENT) {
      return res.status(400).json({
        success: false,
        message: 'Patients do not require approval'
      });
    }

    if (user.approvalStatus === APPROVAL_STATUS.APPROVED) {
      return res.status(400).json({
        success: false,
        message: 'User is already approved'
      });
    }

    user.approvalStatus = APPROVAL_STATUS.APPROVED;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();
    user.rejectionReason = undefined;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} approved successfully`,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
      error: error.message
    });
  }
};

// @desc Reject user (doctor, lab, pharmacy)
// @route PUT /api/admin/reject/:id
// @access Private (Admin)
export const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === USER_ROLES.PATIENT) {
      return res.status(400).json({
        success: false,
        message: 'Patients cannot be rejected'
      });
    }

    user.approvalStatus = APPROVAL_STATUS.REJECTED;
    user.rejectionReason = reason;
    user.approvedBy = req.user.id;
    user.approvedAt = new Date();

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} rejected`,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject user',
      error: error.message
    });
  }
};

// @desc Toggle user active status
// @route PUT /api/admin/toggle-status/:id
// @access Private (Admin)
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate admin users'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// @desc Delete user
// @route DELETE /api/admin/users/:id
// @access Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// @desc Get all appointments (Admin view)
// @route GET /api/admin/appointments
// @access Private (Admin)
export const getAllAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// @desc Get recent activities
// @route GET /api/admin/recent-activities
// @access Private (Admin)
export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent registrations
    const recentUsers = await User.find({ role: { $ne: USER_ROLES.ADMIN } })
      .select('name email role createdAt approvalStatus')
      .sort('-createdAt')
      .limit(limit);

    // Get recent appointments
    const recentAppointments = await Appointment.find()
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .select('status createdAt')
      .sort('-createdAt')
      .limit(limit);

    // Get recent lab reports
    const recentLabReports = await LabReport.find()
      .populate('patient', 'name')
      .populate('laboratory', 'labName')
      .select('status createdAt')
      .sort('-createdAt')
      .limit(limit);

    // Combine and format activities
    const activities = [
      ...recentUsers.map(user => ({
        type: 'registration',
        message: `New ${user.role} registered: ${user.name}`,
        status: user.approvalStatus,
        timestamp: user.createdAt
      })),
      ...recentAppointments.map(apt => ({
        type: 'appointment',
        message: `Appointment: ${apt.patient?.name || 'Unknown'} with Dr. ${apt.doctor?.name || 'Unknown'}`,
        status: apt.status,
        timestamp: apt.createdAt
      })),
      ...recentLabReports.map(report => ({
        type: 'lab_report',
        message: `Lab report for ${report.patient?.name || 'Unknown'} at ${report.laboratory?.labName || 'Unknown'}`,
        status: report.status,
        timestamp: report.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: error.message
    });
  }
};