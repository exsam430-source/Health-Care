import mongoose from 'mongoose';
import { MEDICINE_STATUS } from '../utils/constants.js';

const medicineOrderSchema = new mongoose.Schema({
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicines: [{
    medicineName: String,
    dosage: String,
    quantity: Number
  }],
  status: {
    type: String,
    enum: Object.values(MEDICINE_STATUS),
    default: MEDICINE_STATUS.PENDING
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  pharmacyNotes: String
}, {
  timestamps: true
});

medicineOrderSchema.index({ patient: 1 });
medicineOrderSchema.index({ pharmacy: 1, status: 1 });

export default mongoose.model('MedicineOrder', medicineOrderSchema);