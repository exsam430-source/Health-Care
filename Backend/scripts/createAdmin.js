// scripts/createAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Define constants directly to avoid import issues
const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  LABORATORY: 'laboratory',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin'
};

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const DOCTOR_SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Pediatrician',
  'Orthopedic',
  'Psychiatrist',
  'ENT Specialist',
  'Gynecologist',
  'Ophthalmologist'
];

// Define User Schema directly to avoid import path issues
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
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
  age: Number,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  address: String,
  specialization: {
    type: String,
    enum: DOCTOR_SPECIALIZATIONS
  },
  qualification: String,
  experience: Number,
  licenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  labName: String,
  labLicense: String,
  labAddress: String,
  pharmacyName: String,
  pharmacyLicense: String,
  pharmacyAddress: String,
  approvalStatus: {
    type: String,
    enum: Object.values(APPROVAL_STATUS),
    default: APPROVAL_STATUS.PENDING
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  isActive: {
    type: Boolean,
    default: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Get or create the model
const User = mongoose.models.User || mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
    
    if (existingAdmin) {
      console.log('\n⚠️  Admin already exists:');
      console.log('================================');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log('================================');
      console.log('Use the existing admin credentials to login.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password manually
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user directly with collection insert
    const adminData = {
      name: 'Shawakat Admin',
      email: 'shawkat@admin.com',
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      phone: '1234567890',
      approvalStatus: APPROVAL_STATUS.APPROVED,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const admin = await User.create(adminData);

    console.log('\n✅ Admin created successfully!');
    console.log('================================');
    console.log(`📧 Email: admin@healthcare.com`);
    console.log(`🔑 Password: admin123456`);
    console.log('================================');
    console.log('⚠️  Please change the password after first login!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();