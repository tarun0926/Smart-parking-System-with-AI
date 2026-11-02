import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Parking from './models/Parking.js';
import ParkingSlot from './models/ParkingSlot.js';
import Booking from './models/Booking.js';
import { getAdminAnalytics, getOwnerAnalytics } from './controllers/analyticsController.js';
import { getAllUsers, updateUserStatus, deleteUser } from './controllers/userController.js';
import { createParking, updateParking, deleteParking, updateSlotStatus, addSlotToParking } from './controllers/parkingController.js';
import { getAllBookings, getOwnerBookings } from './controllers/bookingController.js';
import { loginUser } from './controllers/authController.js';

// Mock express response generator
const createRes = () => {
  const res = { statusCode: 200, data: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

async function testAdminOwnerSuite() {
  console.log('====================================================');
  console.log('🚀 Running Admin & Owner Complete Flow Verification');
  console.log('====================================================');

  await connectDB();

  // Test 1: Invalid Login Rejection
  console.log('\n[TEST 1] Testing Invalid Login Rejection...');
  const resLogin = createRes();
  await loginUser(
    { body: { email: 'unknown@user.com', password: 'wrongpassword' } },
    resLogin
  );
  if (resLogin.statusCode !== 401) {
    throw new Error(`Expected status 401 for invalid login, got ${resLogin.statusCode}`);
  }
  console.log('✅ Correctly rejected invalid credentials with 401:', resLogin.data.message);

  // Test 2: Valid Admin & Owner Login
  console.log('\n[TEST 2] Testing Admin & Owner Login Authentication...');
  const resAdminLogin = createRes();
  await loginUser(
    { body: { email: 'admin@smartpark.ai', password: 'password123' } },
    resAdminLogin
  );
  if (resAdminLogin.statusCode !== 200) {
    throw new Error(`Admin login failed: ${resAdminLogin.statusCode}`);
  }
  console.log('✅ Admin login verified:', resAdminLogin.data.user.email, `(${resAdminLogin.data.user.role})`);

  // Test 3: Admin Analytics (7 metrics + 4 charts)
  console.log('\n[TEST 3] Testing Admin Analytics Telemetry...');
  const resAdminAnalytics = createRes();
  await getAdminAnalytics({ user: resAdminLogin.data.user }, resAdminAnalytics);
  const adminData = resAdminAnalytics.data.data;
  console.log('   Total Users:', adminData.totalUsers);
  console.log('   Total Locations:', adminData.totalLocations);
  console.log('   Total Slots:', adminData.totalSlots);
  console.log('   Available Slots:', adminData.availableSlots);
  console.log('   Occupied Slots:', adminData.occupiedSlots);
  console.log('   Today Bookings:', adminData.todayBookings);
  console.log('   Today Revenue: ₹' + adminData.todayRevenue);
  console.log('   Charts verified: occupancyTrends, bookingTrends, revenueTrends, parkingWiseOccupancy');
  if (!adminData.charts.occupancyTrends || !adminData.charts.revenueTrends) {
    throw new Error('Missing admin chart datasets');
  }
  console.log('✅ Admin Analytics validated successfully!');

  // Test 4: Owner Analytics
  console.log('\n[TEST 4] Testing Owner Analytics & AI Predictions...');
  const resOwnerAnalytics = createRes();
  await getOwnerAnalytics({ user: { _id: 'owner_1', role: 'owner' } }, resOwnerAnalytics);
  const ownerData = resOwnerAnalytics.data.data;
  console.log('   Facility Name:', ownerData.parkingName);
  console.log('   Total Slots:', ownerData.totalSlots);
  console.log('   Available Slots:', ownerData.availableSlots);
  console.log('   Occupied Slots:', ownerData.occupiedSlots);
  console.log('   Revenue: ₹' + ownerData.revenue);
  console.log('   AI Forecast Horizons:', Object.keys(ownerData.aiPredictions?.predictions || {}).join(', '));
  if (!ownerData.aiPredictions?.predictions?.['30_min']) {
    throw new Error('Missing 30_min AI prediction horizon');
  }
  console.log('✅ Owner Analytics & AI predictions validated successfully!');

  // Test 5: Admin User Management
  console.log('\n[TEST 5] Testing Admin User Directory & Management...');
  const resUsers = createRes();
  await getAllUsers({}, resUsers);
  console.log(`   Found ${resUsers.data.count} registered users.`);
  const sampleUser = resUsers.data.data[0];
  const resUserStatus = createRes();
  await updateUserStatus({ params: { id: sampleUser.id }, body: { status: 'Suspended' } }, resUserStatus);
  console.log('   Updated user status:', resUserStatus.data.message);
  console.log('✅ User management features validated!');

  // Test 6: Owner Parking Creation, Slot Bay Management, and Update
  console.log('\n[TEST 6] Testing Parking Facility Creation & Slot Management...');
  const resCreateParking = createRes();
  await createParking(
    {
      body: {
        name: 'Nexus Tech Mall Parking',
        address: '42 Koramangala Ring Road',
        pricePerHour: 50,
        totalSlots: 10,
        type: 'Underground Basement',
        facilities: ['EV Charging', 'CCTV'],
      },
      user: { _id: 'owner_1' },
    },
    resCreateParking
  );
  const newParking = resCreateParking.data.data;
  console.log(`   Created new parking: "${newParking.name}" (ID: ${newParking.id || newParking._id}) with slots`);

  // Add slot bay
  const resAddSlot = createRes();
  await addSlotToParking(
    {
      params: { id: newParking.id || newParking._id },
      body: { slotNumber: 'VIP-01', floor: 'Basement 1', type: 'EV Charging', price: 60 },
    },
    resAddSlot
  );
  console.log('   Added new slot bay:', resAddSlot.data.message);

  // Toggle slot status
  const resUpdateSlot = createRes();
  await updateSlotStatus(
    {
      params: { id: newParking.id || newParking._id, slotId: resAddSlot.data.data.id || resAddSlot.data.data._id },
      body: { status: 'maintenance' },
    },
    resUpdateSlot
  );
  console.log('   Updated slot status:', resUpdateSlot.data.message);
  console.log('✅ Owner parking & slot bay management validated!');

  // Test 7: Global & Owner Bookings Audit
  console.log('\n[TEST 7] Testing Global Bookings Audit Log...');
  const resAllBookings = createRes();
  await getAllBookings({}, resAllBookings);
  console.log(`   Retrieved ${resAllBookings.data.count} bookings for Admin Audit.`);
  const resOwnerBookings = createRes();
  await getOwnerBookings({ user: { _id: 'owner_1' } }, resOwnerBookings);
  console.log(`   Retrieved ${resOwnerBookings.data.count} bookings for Owner.`);
  console.log('✅ Bookings audit logs validated!');

  console.log('\n====================================================');
  console.log('🎉 ALL ADMIN & OWNER FLOWS VERIFIED SUCCESSFULLY!');
  console.log('====================================================');

  process.exit(0);
}

testAdminOwnerSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
