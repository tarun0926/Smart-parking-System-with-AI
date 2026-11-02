const BASE_URL = 'http://localhost:5000/api';

async function testBookingFlow() {
  console.log('--- STARTING PARKING & BOOKING SYSTEM TESTS ---\n');

  try {
    // 0. AUTHENTICATE / LOGIN TO GET JWT TOKEN
    console.log('0. Logging in to get JWT token (POST /api/auth/login)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alex.m@example.com',
        password: 'password123',
      }),
    });
    const loginData = await loginRes.json();
    console.log(`LOGIN STATUS: ${loginRes.status}`);
    const token = loginData.token;
    console.log(`TOKEN RECEIVED: ${token ? 'YES' : 'NO'}\n`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 1. TEST GET PARKING SLOTS
    console.log('1. Testing GET /api/parking/p1/slots...');
    const slotsRes = await fetch(`${BASE_URL}/parking/p1/slots`);
    const slotsData = await slotsRes.json();
    console.log(`STATUS: ${slotsRes.status}`);
    console.log(`SLOTS COUNT: ${slotsData.count || slotsData.data?.length}`);
    console.log(`FIRST SLOT:`, slotsData.data?.[0]);
    if (slotsRes.status !== 200) throw new Error('Failed GET slots');
    console.log('✅ PASS: Slots fetched successfully.\n');

    // 2. TEST CREATE BOOKING (SUCCESS CASE)
    console.log('2. Testing POST /api/bookings (Create Booking)...');
    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 7200000).toISOString();
    const bookingPayload = {
      parking: 'p1',
      slot: 'S-1',
      slotNumber: 'A-101',
      startTime: start,
      endTime: end,
      amount: 40,
      vehicleNumber: 'KA-05-EV-4092',
    };

    const createRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(bookingPayload),
    });
    const createData = await createRes.json();
    console.log(`STATUS: ${createRes.status}`);
    console.log(`RESPONSE:`, createData);
    if (createRes.status !== 201) throw new Error(`Create booking failed: ${createData.message}`);
    const bookingId = createData.data?.id || createData.data?._id;
    console.log(`✅ PASS: Booking created with ID: ${bookingId}\n`);

    // 3. TEST GET MY BOOKINGS
    console.log('3. Testing GET /api/bookings/my...');
    const myRes = await fetch(`${BASE_URL}/bookings/my`, {
      headers: authHeaders,
    });
    const myData = await myRes.json();
    console.log(`STATUS: ${myRes.status}`);
    console.log(`TOTAL BOOKINGS: ${myData.count || myData.data?.length}`);
    if (myRes.status !== 200) throw new Error('Get my bookings failed');
    console.log('✅ PASS: My bookings retrieved successfully.\n');

    // 4. TEST GET BOOKING DETAILS BY ID
    console.log(`4. Testing GET /api/bookings/${bookingId}...`);
    const detailRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: authHeaders,
    });
    const detailData = await detailRes.json();
    console.log(`STATUS: ${detailRes.status}`);
    console.log(`BOOKING DETAILS:`, detailData.data);
    if (detailRes.status !== 200) throw new Error('Get booking by ID failed');
    console.log('✅ PASS: Booking details retrieved successfully.\n');

    // 5. TEST CANCEL BOOKING
    console.log(`5. Testing PUT /api/bookings/${bookingId}/cancel...`);
    const cancelRes = await fetch(`${BASE_URL}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: authHeaders,
    });
    const cancelData = await cancelRes.json();
    console.log(`STATUS: ${cancelRes.status}`);
    console.log(`CANCEL RESPONSE:`, cancelData);
    if (cancelRes.status !== 200) throw new Error('Cancel booking failed');
    console.log('✅ PASS: Booking cancelled successfully.\n');

    console.log('🎉 ALL BACKEND API TESTS COMPLETED & VERIFIED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ TEST FAILED WITH ERROR:', err.message);
    process.exit(1);
  }
}

testBookingFlow();
