import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import { USER_ROLES } from '../utils/constants.js';

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
export const createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, additionalNotes, validUntil } = req.body;

    // Verify appointment exists and belongs to doctor
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const prescription = await Prescription.create({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: req.user.id,
      diagnosis,
      medicines,
      additionalNotes,
      validUntil
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name specialization qualification')
      .populate('appointment');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
};

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === USER_ROLES.PATIENT) {
      query.patient = req.user.id;
    } else if (req.user.role === USER_ROLES.DOCTOR) {
      query.doctor = req.user.id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone age')
      .populate('doctor', 'name specialization')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions',
      error: error.message
    });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone age gender bloodGroup')
      .populate('doctor', 'name specialization qualification')
      .populate('appointment');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Authorization check
    if (
      req.user.role === USER_ROLES.PATIENT &&
      prescription.patient._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  }
};