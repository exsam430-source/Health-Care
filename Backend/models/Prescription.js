import mongoose from 'mongoose';

const medicineItemSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: String
});

const prescriptionSchema = new mongoose.Schema({
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
  diagnosis: {
    type: String,
    required: true
  },
  medicines: [medicineItemSchema],
  additionalNotes: String,
  validUntil: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });

export default mongoose.model('Prescription', prescriptionSchema);