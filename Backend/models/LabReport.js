import mongoose from 'mongoose';
import { LAB_STATUS } from '../utils/constants.js';

const testItemSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true
  },
  testCode: String,
  description: String
});

const labReportSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  laboratory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testsRequested: [testItemSchema],
  status: {
    type: String,
    enum: Object.values(LAB_STATUS),
    default: LAB_STATUS.REQUESTED
  },
  results: {
    type: String,
    default: ''
  },
  reportFile: {
    type: String, // URL or file path
    default: ''
  },
  remarks: String,
  completedAt: Date
}, {
  timestamps: true
});

labReportSchema.index({ patient: 1 });
labReportSchema.index({ laboratory: 1, status: 1 });

export default mongoose.model('LabReport', labReportSchema);