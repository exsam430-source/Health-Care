// scripts/seedDB.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

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

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(USER_ROLES), required: true },
  phone: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  address: String,
  specialization: { type: String, enum: DOCTOR_SPECIALIZATIONS },
  qualification: String,
  experience: Number,
  licenseNumber: { type: String, unique: true, sparse: true },
  labName: String,
  labLicense: String,
  labAddress: String,
  pharmacyName: String,
  pharmacyLicense: String,
  pharmacyAddress: String,
  approvalStatus: { type: String, enum: Object.values(APPROVAL_STATUS), default: APPROVAL_STATUS.PENDING },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing users (optional, let's keep admin if it exists)
    // We will delete previously seeded test accounts to avoid duplicate keys
    const testEmails = [
      'doctor@healthcare.com',
      'patient@healthcare.com',
      'lab@healthcare.com',
      'pharmacy@healthcare.com',
      'admin@healthcare.com'
    ];
    await User.deleteMany({ email: { $in: testEmails } });
    console.log('🧹 Cleaned up old seeded test users');

    const hashedPassword = await bcrypt.hash('password123', 12);

    const seedUsers = [
      {
        name: 'Dr. John Smith',
        email: 'doctor@healthcare.com',
        password: hashedPassword,
        role: USER_ROLES.DOCTOR,
        phone: '9876543210',
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        experience: 10,
        licenseNumber: 'DOC12345',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true
      },
      {
        name: 'Jane Doe',
        email: 'patient@healthcare.com',
        password: hashedPassword,
        role: USER_ROLES.PATIENT,
        phone: '9988776655',
        age: 28,
        gender: 'female',
        bloodGroup: 'O+',
        address: '123 Health Ave, Medical City',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true
      },
      {
        name: 'Central Diagnostic Lab',
        email: 'lab@healthcare.com',
        password: hashedPassword,
        role: USER_ROLES.LABORATORY,
        phone: '5566778899',
        labName: 'Central Diagnostics',
        labLicense: 'LAB98765',
        labAddress: '456 Tech Park, Biotech City',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true
      },
      {
        name: 'City Care Pharmacy',
        email: 'pharmacy@healthcare.com',
        password: hashedPassword,
        role: USER_ROLES.PHARMACY,
        phone: '1122334455',
        pharmacyName: 'City Care Pharmacy',
        pharmacyLicense: 'PHM54321',
        pharmacyAddress: '789 Market Rd, Commercial Area',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true
      },
      {
        name: 'System Admin',
        email: 'admin@healthcare.com',
        password: hashedPassword,
        role: USER_ROLES.ADMIN,
        phone: '1234567890',
        approvalStatus: APPROVAL_STATUS.APPROVED,
        isActive: true
      }
    ];

    await User.insertMany(seedUsers);
    console.log('\n✅ Database seeded successfully!');
    console.log('=========================================');
    console.log('Use the following credentials to log in:');
    console.log('🔑 Password for all: password123');
    console.log('-----------------------------------------');
    console.log('🩺 Doctor:   doctor@healthcare.com');
    console.log('👤 Patient:  patient@healthcare.com');
    console.log('🔬 Lab:      lab@healthcare.com');
    console.log('💊 Pharmacy: pharmacy@healthcare.com');
    console.log('⚙️ Admin:    admin@healthcare.com');
    console.log('=========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
