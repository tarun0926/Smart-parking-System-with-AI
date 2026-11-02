import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Parking from '../models/Parking.js';
import User from '../models/User.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { parking, slot, startTime, endTime, vehicleNumber, amount } = req.body;
    const userId = req.user?._id;

    // 1. Validation for required fields
    if (!parking || !slot || !startTime || !endTime) {
      return res.status(400).json({
        message: 'Please provide all required fields: parking, slot, startTime, and endTime.',
      });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required to create a booking.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start time or end time format.' });
    }

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected. Cannot create booking.' });
    }

    if (!mongoose.Types.ObjectId.isValid(parking) || !mongoose.Types.ObjectId.isValid(slot)) {
      return res.status(400).json({ message: 'Invalid parking or slot ID.' });
    }

    // 2. Fetch parking & slot details from MongoDB
    const parkingDoc = await Parking.findById(parking);
    if (!parkingDoc) {
      return res.status(404).json({ message: 'Parking facility not found.' });
    }

    const slotDoc = await ParkingSlot.findById(slot);
    if (!slotDoc) {
      return res.status(404).json({ message: 'Parking slot bay not found.' });
    }

    // Verify slot belongs to the specified parking
    if (slotDoc.parking.toString() !== parkingDoc._id.toString()) {
      return res.status(400).json({ message: 'Selected slot does not belong to this parking location.' });
    }

    // 3. Prevent booking occupied or reserved slots
    if (slotDoc.status.toLowerCase() !== 'available') {
      return res.status(400).json({
        message: `Slot ${slotDoc.slotNumber} is currently ${slotDoc.status} and unavailable for booking. Please select an available slot.`,
      });
    }

    // 4. Prevent double booking for overlapping timeframes
    const overlappingBooking = await Booking.findOne({
      slot: slotDoc._id,
      status: { $in: ['Active', 'Pending'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: `Double booking conflict: Slot ${slotDoc.slotNumber} is already booked for the selected timeframe (${new Date(overlappingBooking.startTime).toLocaleTimeString()} - ${new Date(overlappingBooking.endTime).toLocaleTimeString()}).`,
      });
    }

    // Calculate total hours and amount
    const durationMs = end - start;
    const totalHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
    const computedAmount = Number(amount) || totalHours * (slotDoc.price || parkingDoc.pricePerHour || 40);

    // Create Booking Document
    const newBooking = await Booking.create({
      user: userId,
      parking: parkingDoc._id,
      slot: slotDoc._id,
      slotNumber: slotDoc.slotNumber,
      startTime: start,
      endTime: end,
      totalHours,
      amount: computedAmount,
      totalPrice: computedAmount,
      vehicleNumber: vehicleNumber || req.user?.vehicle || '',
      status: 'Active',
    });

    // Update Slot status to occupied
    await ParkingSlot.findByIdAndUpdate(slotDoc._id, { status: 'occupied' });

    // Synchronize availableSlots count in Parking
    const remainingAvailableSlots = await ParkingSlot.countDocuments({
      parking: parkingDoc._id,
      status: 'available',
    });
    await Parking.findByIdAndUpdate(parkingDoc._id, {
      availableSlots: remainingAvailableSlots,
      status: remainingAvailableSlots === 0 ? 'Full' : 'Active',
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('parking', 'name address city pricePerHour')
      .populate('slot', 'slotNumber floor type status')
      .populate('user', 'name email phone');

    return res.status(201).json({
      success: true,
      message: `Booking reserved successfully! Slot ${slotDoc.slotNumber} has been reserved.`,
      data: {
        ...populatedBooking.toObject(),
        id: populatedBooking._id,
        parkingName: parkingDoc.name,
        address: parkingDoc.address,
      },
    });
  } catch (error) {
    console.error('[Create Booking Error]:', error);
    return res.status(500).json({ message: error.message || 'Error creating parking booking.' });
  }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/my
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate('parking', 'name address city distance pricePerHour rating')
      .populate('slot', 'slotNumber floor type status')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id,
      parkingName: b.parking?.name || 'Parking Facility',
      address: b.parking?.address || 'City Center',
      slotNumber: b.slotNumber || b.slot?.slotNumber || 'A1',
      amount: b.amount || b.totalPrice,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('[Get My Bookings Error]:', error);
    return res.status(500).json({ message: 'Error fetching user bookings.' });
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id)
      .populate('parking')
      .populate('slot')
      .populate('user', 'name email phone vehicle')
      .lean();

    if (!booking) {
      return res.status(404).json({ message: 'Booking ticket not found.' });
    }

    // Security: only the booking owner or admin can view it
    if (
      req.user &&
      req.user.role !== 'admin' &&
      booking.user?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied. This booking does not belong to your account.' });
    }

    return res.json({
      success: true,
      data: {
        ...booking,
        id: booking._id,
        parkingName: booking.parking?.name,
        address: booking.parking?.address,
        slotNumber: booking.slotNumber || booking.slot?.slotNumber || 'A1',
      },
    });
  } catch (error) {
    console.error('[Get Booking By ID Error]:', error);
    return res.status(500).json({ message: 'Error fetching booking details.' });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking ID.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Security: only the booking owner or admin can cancel
    if (
      req.user &&
      req.user.role !== 'admin' &&
      booking.user?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied. You cannot cancel another user\'s booking.' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking.' });
    }

    // Update status to Cancelled
    booking.status = 'Cancelled';
    await booking.save();

    // Free up slot back to available
    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'available' });
    }

    // Synchronize availableSlots in Parking
    if (booking.parking) {
      const remainingAvailableSlots = await ParkingSlot.countDocuments({
        parking: booking.parking,
        status: 'available',
      });
      await Parking.findByIdAndUpdate(booking.parking, {
        availableSlots: remainingAvailableSlots,
        status: remainingAvailableSlots === 0 ? 'Full' : 'Active',
      });
    }

    return res.json({
      success: true,
      message: 'Booking cancelled successfully! Slot has been released and is now available.',
      data: {
        ...booking.toObject(),
        id: booking._id,
      },
    });
  } catch (error) {
    console.error('[Cancel Booking Error]:', error);
    return res.status(500).json({ message: error.message || 'Error cancelling booking.' });
  }
};

// @desc    Get all bookings for Admin audit log
// @route   GET /api/bookings
// @access  Private / Admin
export const getAllBookings = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    const bookings = await Booking.find()
      .populate('parking', 'name address city pricePerHour')
      .populate('slot', 'slotNumber floor type status')
      .populate('user', 'name email phone vehicle')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id,
      parkingName: b.parking?.name || 'Parking Facility',
      address: b.parking?.address || 'City Center',
      slotNumber: b.slotNumber || b.slot?.slotNumber || 'A1',
      vehicleNumber: b.vehicleNumber || b.user?.vehicle || '',
      customerName: b.user?.name || 'Unknown',
      customerEmail: b.user?.email || '',
      totalPrice: b.totalPrice || b.amount || 0,
      status: b.status || 'Active',
      startTime: b.startTime ? new Date(b.startTime).toLocaleString() : '',
      endTime: b.endTime ? new Date(b.endTime).toLocaleString() : '',
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('[Get All Bookings Error]:', error);
    return res.status(500).json({ message: 'Error retrieving platform bookings' });
  }
};

// @desc    Get bookings for Owner parking locations
// @route   GET /api/bookings/owner
// @access  Private / Owner
export const getOwnerBookings = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      return res.status(503).json({ message: 'Database not connected.' });
    }

    if (!req.user?._id || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Find parking lots owned by this owner
    const ownerParkings = await Parking.find({ owner: req.user._id }).select('_id');
    const parkingIds = ownerParkings.map(p => p._id);

    const bookings = await Booking.find({ parking: { $in: parkingIds } })
      .populate('parking', 'name address city')
      .populate('slot', 'slotNumber floor type status')
      .populate('user', 'name email phone vehicle')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id,
      parkingName: b.parking?.name || 'Managed Facility',
      address: b.parking?.address || 'City Center',
      slotNumber: b.slotNumber || b.slot?.slotNumber || 'A1',
      vehicleNumber: b.vehicleNumber || b.user?.vehicle || '',
      customerName: b.user?.name || 'Customer',
      totalPrice: b.totalPrice || b.amount || 0,
      status: b.status || 'Active',
      startTime: b.startTime ? new Date(b.startTime).toLocaleString() : '',
      endTime: b.endTime ? new Date(b.endTime).toLocaleString() : '',
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('[Get Owner Bookings Error]:', error);
    return res.status(500).json({ message: 'Error retrieving owner facility bookings' });
  }
};
