import MedicineOrder from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';
import { USER_ROLES, MEDICINE_STATUS } from '../utils/constants.js';

// @desc    Create medicine order
// @route   POST /api/pharmacy/orders
// @access  Private (Doctor/Patient)
export const createMedicineOrder = async (req, res) => {
  try {
    const { prescriptionId, pharmacyId, deliveryAddress, medicines } = req.body;

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const medicineOrder = await MedicineOrder.create({
      prescription: prescriptionId,
      patient: prescription.patient,
      pharmacy: pharmacyId,
      medicines,
      deliveryAddress
    });

    const populatedOrder = await MedicineOrder.findById(medicineOrder._id)
      .populate('patient', 'name email phone')
      .populate('pharmacy', 'pharmacyName email phone')
      .populate('prescription');

    res.status(201).json({
      success: true,
      message: 'Medicine order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create medicine order',
      error: error.message
    });
  }
};

// @desc    Get medicine orders
// @route   GET /api/pharmacy/orders
// @access  Private
export const getMedicineOrders = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === USER_ROLES.PATIENT) {
      query.patient = req.user.id;
    } else if (req.user.role === USER_ROLES.PHARMACY) {
      query.pharmacy = req.user.id;
    }

    const orders = await MedicineOrder.find(query)
      .populate('patient', 'name email phone')
      .populate('pharmacy', 'pharmacyName email phone')
      .populate('prescription')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine orders',
      error: error.message
    });
  }
};

// @desc    Update medicine order status
// @route   PUT /api/pharmacy/orders/:id
// @access  Private (Pharmacy)
export const updateMedicineOrder = async (req, res) => {
  try {
    const { status, estimatedDelivery, actualDelivery, pharmacyNotes } = req.body;

    const order = await MedicineOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Medicine order not found'
      });
    }

    if (order.pharmacy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (status) order.status = status;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    if (actualDelivery) order.actualDelivery = actualDelivery;
    if (pharmacyNotes) order.pharmacyNotes = pharmacyNotes;

    await order.save();

    const updatedOrder = await MedicineOrder.findById(order._id)
      .populate('patient', 'name email phone')
      .populate('pharmacy', 'pharmacyName')
      .populate('prescription');

    res.status(200).json({
      success: true,
      message: 'Medicine order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine order',
      error: error.message
    });
  }
};

// @desc    Get single medicine order
// @route   GET /api/pharmacy/orders/:id
// @access  Private
export const getMedicineOrder = async (req, res) => {
  try {
    const order = await MedicineOrder.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('pharmacy', 'pharmacyName email phone')
      .populate('prescription');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Medicine order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicine order',
      error: error.message
    });
  }
};