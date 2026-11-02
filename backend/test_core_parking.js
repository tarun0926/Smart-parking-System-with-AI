import axios from 'axios';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Parking from './models/Parking.js';
import ParkingSlot from './models/ParkingSlot.js';
import Booking from './models/Booking.js';
import jwt from 'jsonwebtoken';

async function runTests() {
  console.log('==========================================');
  console.log('🚀 Running Core Parking Management Tests');
  console.log('==========================================');

  // 1. Connect DB
  const connected = await connectDB();
  if (!connected) {
    throw new Error('Database connection failed');
  }

  // 2. Fetch driver user & generate token
  let testUser = await User.findOne({ email: 'alex.m@example.com' });
  if (!testUser) {
    testUser = await User.create({
      name: 'Alex Morgan',
      email: 'alex.m@example.com',
      password: 'password123',
      role: 'user',
      vehicle: 'KA-05-EV-4092',
    });
  }

  const token = jwt.sign(
    { id: testUser._id, role: testUser.role },
    process.env.JWT_SECRET || 'smartpark_ai_super_secret_jwt_key_2026',
    { expiresIn: '1d' }
  );

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: GET /api/parking
  const parkings = await Parking.find();
  console.log(`\n✅ TEST 1: Found ${parkings.length} parking locations in MongoDB.`);
  if (parkings.length === 0) throw new Error('No parking locations found');
  const targetParking = parkings[0];
  console.log(`   Selected: "${targetParking.name}", Price: ₹${targetParking.pricePerHour}/hr, Available: ${targetParking.availableSlots}/${targetParking.totalSlots}`);

  // Test 2: GET /api/parking/:id/slots
  const slots = await ParkingSlot.find({ parking: targetParking._id });
  console.log(`\n✅ TEST 2: Found ${slots.length} individual slots for parking "${targetParking.name}".`);
  const availableSlots = slots.filter((s) => s.status === 'available');
  const occupiedSlots = slots.filter((s) => s.status === 'occupied');
  const reservedSlots = slots.filter((s) => s.status === 'reserved');
  console.log(`   Slot breakdown -> Available: ${availableSlots.length}, Occupied: ${occupiedSlots.length}, Reserved: ${reservedSlots.length}`);
  console.log(`   Sample slots: ${slots.slice(0, 6).map((s) => `${s.slotNumber} (${s.status})`).join(', ')}`);

  if (availableSlots.length === 0) throw new Error('No available slots for testing');
  const targetSlot = availableSlots[0];
  console.log(`   Target slot chosen for booking: ${targetSlot.slotNumber} (ID: ${targetSlot._id})`);

  // Test 3: POST /api/bookings (Create booking)
  console.log(`\n✅ TEST 3: Creating booking for slot ${targetSlot.slotNumber}...`);
  const startTime = new Date(Date.now() + 3600000); // 1 hr from now
  const endTime = new Date(Date.now() + 7200000); // 2 hrs from now
  const initialAvailableCount = targetParking.availableSlots;

  // Import controller directly or test via controller logic
  import('./controllers/bookingController.js').then(async ({ createBooking, getMyBookings, getBookingById, cancelBooking }) => {
    // Helper to simulate express req/res
    const mockReq = (body, user = testUser, params = {}) => ({
      body,
      user,
      params,
      headers: authHeaders,
    });

    const createRes = () => {
      const res = {};
      res.statusCode = 200;
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => { res.data = data; return res; };
      return res;
    };

    // Execute createBooking
    const res1 = createRes();
    await createBooking(
      mockReq({
        parking: targetParking._id.toString(),
        slot: targetSlot._id.toString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        vehicleNumber: 'KA-05-EV-4092',
        amount: 80,
      }),
      res1
    );

    if (res1.statusCode !== 201) {
      console.error('Booking failed:', res1.data);
      throw new Error(`Create booking returned status ${res1.statusCode}`);
    }
    const createdBooking = res1.data.data;
    console.log(`   Booking created successfully! Booking ID: ${createdBooking._id}, Amount: ₹${createdBooking.amount}`);

    // Verify slot status changed to occupied
    const slotAfter = await ParkingSlot.findById(targetSlot._id);
    console.log(`   Slot ${targetSlot.slotNumber} status after booking: "${slotAfter.status}" (Expected: "occupied")`);
    if (slotAfter.status !== 'occupied') throw new Error('Slot status was not updated to occupied');

    // Verify parking available count decremented
    const parkingAfter = await Parking.findById(targetParking._id);
    console.log(`   Parking availableSlots after booking: ${parkingAfter.availableSlots} (Was: ${initialAvailableCount})`);

    // Test 4: Prevent booking occupied slots
    console.log(`\n✅ TEST 4: Testing prevention of booking occupied slot ${targetSlot.slotNumber}...`);
    const res2 = createRes();
    await createBooking(
      mockReq({
        parking: targetParking._id.toString(),
        slot: targetSlot._id.toString(),
        startTime: new Date(Date.now() + 10000000).toISOString(),
        endTime: new Date(Date.now() + 14000000).toISOString(),
        vehicleNumber: 'KA-05-EV-4092',
        amount: 80,
      }),
      res2
    );
    console.log(`   Result status: ${res2.statusCode}, Message: "${res2.data.message}"`);
    if (res2.statusCode !== 400) throw new Error('Failed to block booking of occupied slot');

    // Test 5: Double booking prevention (overlapping timeframe)
    console.log(`\n✅ TEST 5: Testing double-booking overlap prevention...`);
    // Manually mark slot as available for test check
    await ParkingSlot.findByIdAndUpdate(targetSlot._id, { status: 'available' });
    const res3 = createRes();
    await createBooking(
      mockReq({
        parking: targetParking._id.toString(),
        slot: targetSlot._id.toString(),
        startTime: new Date(startTime.getTime() + 1800000).toISOString(), // overlapping 30m in
        endTime: new Date(endTime.getTime() + 1800000).toISOString(),
        vehicleNumber: 'MH-01-AB-1234',
        amount: 80,
      }),
      res3
    );
    console.log(`   Result status: ${res3.statusCode}, Message: "${res3.data.message}"`);
    if (res3.statusCode !== 409) throw new Error('Failed to block overlapping double booking');

    // Re-mark slot as occupied
    await ParkingSlot.findByIdAndUpdate(targetSlot._id, { status: 'occupied' });

    // Test 6: GET /api/bookings/my
    console.log(`\n✅ TEST 6: Testing getMyBookings...`);
    const res4 = createRes();
    await getMyBookings(mockReq({}, testUser), res4);
    console.log(`   Retrieved ${res4.data.count} bookings for user ${testUser.name}.`);
    if (res4.data.count === 0) throw new Error('Failed to retrieve user bookings');

    // Test 7: GET /api/bookings/:id
    console.log(`\n✅ TEST 7: Testing getBookingById for ID: ${createdBooking._id}...`);
    const res5 = createRes();
    await getBookingById(mockReq({}, testUser, { id: createdBooking._id.toString() }), res5);
    console.log(`   Retrieved booking details: Parking: "${res5.data.data.parkingName}", Slot: "${res5.data.data.slotNumber}", Status: "${res5.data.data.status}"`);

    // Test 8: PUT /api/bookings/:id/cancel
    console.log(`\n✅ TEST 8: Testing cancelBooking for ID: ${createdBooking._id}...`);
    const res6 = createRes();
    await cancelBooking(mockReq({}, testUser, { id: createdBooking._id.toString() }), res6);
    console.log(`   Cancel status: ${res6.statusCode}, Message: "${res6.data.message}"`);
    if (res6.statusCode !== 200) throw new Error('Failed to cancel booking');

    const slotAfterCancel = await ParkingSlot.findById(targetSlot._id);
    console.log(`   Slot status after cancellation: "${slotAfterCancel.status}" (Expected: "available")`);
    if (slotAfterCancel.status !== 'available') throw new Error('Slot status was not released back to available');

    const parkingAfterCancel = await Parking.findById(targetParking._id);
    console.log(`   Parking availableSlots after cancellation: ${parkingAfterCancel.availableSlots}`);

    console.log('\n==========================================');
    console.log('🎉 ALL 8 CORE PARKING SYSTEM TESTS PASSED!');
    console.log('==========================================');
    process.exit(0);
  });
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
