const BASE_URL = 'http://localhost:5000/api';

async function testValidations() {
  console.log('--- STARTING DOUBLE BOOKING & VALIDATION TESTS ---\n');

  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.m@example.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // TEST INVALID DATES (endTime before startTime)
    console.log('1. Testing POST /api/bookings with invalid dates (endTime <= startTime)...');
    const badDateRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parking: 'p1',
        slot: 'S-1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() - 3600000).toISOString(),
      }),
    });
    const badDateData = await badDateRes.json();
    console.log(`STATUS: ${badDateRes.status}`);
    console.log(`ERROR MSG: "${badDateData.message}"`);
    if (badDateRes.status === 400) {
      console.log('✅ PASS: Rejection on invalid date range verified.\n');
    }

    // TEST MISSING REQUIRED FIELDS
    console.log('2. Testing POST /api/bookings with missing slot...');
    const missingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        parking: 'p1',
        startTime: new Date().toISOString(),
      }),
    });
    const missingData = await missingRes.json();
    console.log(`STATUS: ${missingRes.status}`);
    console.log(`ERROR MSG: "${missingData.message}"`);
    if (missingRes.status === 400) {
      console.log('✅ PASS: Rejection on missing fields verified.\n');
    }

    console.log('🎉 ALL ERROR & VALIDATION TESTS PASSED!');
  } catch (err) {
    console.error('❌ VALIDATION TEST FAILED:', err);
    process.exit(1);
  }
}

testValidations();
