// controllers/authController.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { USER_ROLES, APPROVAL_STATUS } from '../utils/constants.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc Register user
// @route POST /api/auth/register
// @access Public
export const register = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Prevent registration as admin through API
    if (role === USER_ROLES.ADMIN) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register as admin'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create(req.body);

    // Generate token only for approved users (patients)
    let token = null;
    if (user.approvalStatus === APPROVAL_STATUS.APPROVED) {
      token = generateToken(user._id);
    }

    // Determine message based on role
    let message = 'Registration successful';
    if ([USER_ROLES.DOCTOR, USER_ROLES.LABORATORY, USER_ROLES.PHARMACY].includes(role)) {
      message = 'Registration successful. Your account is pending admin approval.';
    }

    res.status(201).json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          approvalStatus: user.approvalStatus
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Check approval status for doctors, labs, pharmacies
    if ([USER_ROLES.DOCTOR, USER_ROLES.LABORATORY, USER_ROLES.PHARMACY].includes(user.role)) {
      if (user.approvalStatus === APPROVAL_STATUS.PENDING) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending admin approval'
        });
      }
      if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
        return res.status(403).json({
          success: false,
          message: `Your account was rejected. Reason: ${user.rejectionReason || 'Not specified'}`
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc Get current user
// @route GET /api/auth/me
// @access Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// @desc Get all doctors
// @route GET /api/auth/doctors
// @access Private (Patient)
export const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;

    let query = { 
      role: USER_ROLES.DOCTOR, 
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED
    };

    if (specialization) {
      query.specialization = specialization;
    }

    const doctors = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
      error: error.message
    });
  }
};

// @desc Get all laboratories
// @route GET /api/auth/laboratories
// @access Private
export const getLaboratories = async (req, res) => {
  try {
    const laboratories = await User.find({
      role: USER_ROLES.LABORATORY,
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED
    }).select('-password');

    res.status(200).json({
      success: true,
      count: laboratories.length,
      data: laboratories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch laboratories',
      error: error.message
    });
  }
};

// @desc Get all pharmacies
// @route GET /api/auth/pharmacies
// @access Private
export const getPharmacies = async (req, res) => {
  try {
    const pharmacies = await User.find({
      role: USER_ROLES.PHARMACY,
      isActive: true,
      approvalStatus: APPROVAL_STATUS.APPROVED
    }).select('-password');

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pharmacies',
      error: error.message
    });
  }
};