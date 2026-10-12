// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, DOCTOR_SPECIALIZATIONS, APPROVAL_STATUS } from '../utils/constants.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,  // This already creates an index, so remove schema.index for email
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },

  // Patient-specific fields
  age: {
    type: Number,
    required: function() { return this.role === USER_ROLES.PATIENT; }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: function() { return this.role === USER_ROLES.PATIENT; }
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.role === USER_ROLES.PATIENT; }
  },
  address: String,

  // Doctor-specific fields
  specialization: {
    type: String,
    enum: DOCTOR_SPECIALIZATIONS,
    required: function() { return this.role === USER_ROLES.DOCTOR; }
  },
  qualification: {
    type: String,
    required: function() { return this.role === USER_ROLES.DOCTOR; }
  },
  experience: {
    type: Number,
    required: function() { return this.role === USER_ROLES.DOCTOR; }
  },
  licenseNumber: {
    type: String,
    required: function() { return this.role === USER_ROLES.DOCTOR; },
    unique: true,
    sparse: true
  },

  // Laboratory-specific fields
  labName: {
    type: String,
    required: function() { return this.role === USER_ROLES.LABORATORY; }
  },
  labLicense: {
    type: String,
    required: function() { return this.role === USER_ROLES.LABORATORY; }
  },
  labAddress: {
    type: String
  },

  // Pharmacy-specific fields
  pharmacyName: {
    type: String,
    required: function() { return this.role === USER_ROLES.PHARMACY; }
  },
  pharmacyLicense: {
    type: String,
    required: function() { return this.role === USER_ROLES.PHARMACY; }
  },
  pharmacyAddress: {
    type: String
  },

  // Approval fields for doctors, labs, pharmacies
  approvalStatus: {
  type: String,
  enum: Object.values(APPROVAL_STATUS),
  default: APPROVAL_STATUS.PENDING
},
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  profileImage: {
    type: String,
    default: ''
  },

  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

userSchema.pre('save', function() {
  // Only set approvalStatus on new documents
  if (this.isNew && !this.approvalStatus) {
    if (this.role === USER_ROLES.PATIENT || this.role === USER_ROLES.ADMIN) {
      this.approvalStatus = APPROVAL_STATUS.APPROVED;
    } else {
      this.approvalStatus = APPROVAL_STATUS.PENDING;
    }
  }
});


// Hash password before saving - FIXED: removed 'next' parameter for async function
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can access the system
userSchema.methods.canAccess = function() {
  if (this.role === USER_ROLES.PATIENT || this.role === USER_ROLES.ADMIN) {
    return this.isActive;
  }
  return this.isActive && this.approvalStatus === APPROVAL_STATUS.APPROVED;
};

// Only index on role and approvalStatus (email already has unique: true which creates index)
userSchema.index({ role: 1, approvalStatus: 1 });

export default mongoose.model('User', userSchema);