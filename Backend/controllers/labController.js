import LabReport from '../models/LabReport.js';
import Appointment from '../models/Appointment.js';
import { USER_ROLES, LAB_STATUS } from '../utils/constants.js';

// @desc    Create lab test request
// @route   POST /api/lab/request
// @access  Private (Doctor)
export const createLabRequest = async (req, res) => {
  try {
    const { appointmentId, laboratoryId, testsRequested } = req.body;

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

    const labReport = await LabReport.create({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: req.user.id,
      laboratory: laboratoryId,
      testsRequested
    });

    const populatedReport = await LabReport.findById(labReport._id)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name specialization')
      .populate('laboratory', 'labName email phone');

    res.status(201).json({
      success: true,
      message: 'Lab test request created successfully',
      data: populatedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create lab request',
      error: error.message
    });
  }
};

// @desc    Get lab reports
// @route   GET /api/lab/reports
// @access  Private
export const getLabReports = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === USER_ROLES.PATIENT) {
      query.patient = req.user.id;
    } else if (req.user.role === USER_ROLES.DOCTOR) {
      query.doctor = req.user.id;
    } else if (req.user.role === USER_ROLES.LABORATORY) {
      query.laboratory = req.user.id;
    }

    const reports = await LabReport.find(query)
      .populate('patient', 'name email phone age gender')
      .populate('doctor', 'name specialization')
      .populate('laboratory', 'labName email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab reports',
      error: error.message
    });
  }
};

// @desc    Update lab report
// @route   PUT /api/lab/reports/:id
// @access  Private (Laboratory)
export const updateLabReport = async (req, res) => {
  try {
    const { status, results, reportFile, remarks } = req.body;

    const labReport = await LabReport.findById(req.params.id);

    if (!labReport) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    if (labReport.laboratory.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (status) labReport.status = status;
    if (results) labReport.results = results;
    if (reportFile) labReport.reportFile = reportFile;
    if (remarks) labReport.remarks = remarks;

    if (status === LAB_STATUS.COMPLETED) {
      labReport.completedAt = new Date();
    }

    await labReport.save();

    const updatedReport = await LabReport.findById(labReport._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('laboratory', 'labName');

    res.status(200).json({
      success: true,
      message: 'Lab report updated successfully',
      data: updatedReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update lab report',
      error: error.message
    });
  }
};

// @desc    Get single lab report
// @route   GET /api/lab/reports/:id
// @access  Private
export const getLabReport = async (req, res) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate('patient', 'name email phone age gender bloodGroup')
      .populate('doctor', 'name specialization')
      .populate('laboratory', 'labName email phone')
      .populate('appointment');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Lab report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab report',
      error: error.message
    });
  }
};