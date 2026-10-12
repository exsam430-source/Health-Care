import mongoose from 'mongoose';
import { APPOINTMENT_STATUS } from '../utils/constants.js';

const appointmentSchema = new mongoose.Schema({
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
  symptoms: [{
    type: String,
    required: true
  }],
  aiPrediction: {
    diseases: [String],
    confidence: Number,
    suggestedSpecialization: String
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(APPOINTMENT_STATUS),
    default: APPOINTMENT_STATUS.PENDING
  },
  doctorNotes: String,
  diagnosis: String,
  rejectionReason: String
}, {
  timestamps: true
});

// Index for faster queries
appointmentSchema.index({ patient: 1, status: 1 });
appointmentSchema.index({ doctor: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);