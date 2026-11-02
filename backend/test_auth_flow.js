import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import { registerUser, loginUser } from './controllers/authController.js';
import { getUserProfile, updateUserProfile } from './controllers/userController.js';
import jwt from 'jsonwebtoken';

const mockRes = () => {
  const res = { statusCode: 200, data: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

async function runAuthTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUTHENTICATION TEST SUITE');
  console.log('====================================================');

  await connectDB();

  const timestamp = Date.now();
  const testEmail = `driver_${timestamp}@example.com`;
  const testPassword = 'SecurePass123!';
  const testName = 'Marcus Vance';
  const testPhone = '+91 91234 56789';
  const testVehicle = 'MH-12-AB-9999';

  // TEST 1: Register completely new user
  console.log('\n[TEST 1] Registering a new driver user...');
  const resReg = mockRes();
  await registerUser({
    body: {
      name: testName,
      email: `  ${testEmail.toUpperCase()}  `, // Test email normalization (trim + lowercase)
      password: testPassword,
      role: 'user',
      phone: testPhone,
      vehicle: testVehicle,
    }
  }, resReg);

  if (resReg.statusCode !== 201) {
    throw new Error(`Registration failed with status ${resReg.statusCode}: ${JSON.stringify(resReg.data)}`);
  }
  if (!resReg.data.token || !resReg.data.user) {
    throw new Error('Registration did not return token or user object');
  }
  if (resReg.data.user.name !== testName || resReg.data.user.email !== testEmail) {
    throw new Error(`Returned user does not match input: ${JSON.stringify(resReg.data.user)}`);
  }
  console.log('✅ TEST 1 PASSED: Registration successful with token & user profile:', resReg.data.user.email);

  // TEST 2: Verify user in MongoDB
  console.log('\n[TEST 2] Verifying record directly in MongoDB...');
  const dbUser = await User.findOne({ email: testEmail }).select('+password');
  if (!dbUser) {
    throw new Error('User not found in MongoDB database');
  }
  if (dbUser.password === testPassword) {
    throw new Error('Security flaw: Password was not hashed in MongoDB!');
  }
  if (!dbUser.password.startsWith('$2a$') && !dbUser.password.startsWith('$2b$')) {
    throw new Error('Password hash does not look like a bcrypt hash: ' + dbUser.password);
  }
  if (dbUser.vehicle !== testVehicle) {
    throw new Error(`Vehicle plate mismatch: expected ${testVehicle}, got ${dbUser.vehicle}`);
  }
  console.log('✅ TEST 2 PASSED: MongoDB document verified with bcrypt hashed password:', dbUser._id.toString());

  // TEST 3: Attempt duplicate registration
  console.log('\n[TEST 3] Testing duplicate email rejection...');
  const resDup = mockRes();
  await registerUser({
    body: {
      name: 'Another Person',
      email: testEmail.toUpperCase(),
      password: 'anotherpassword',
      role: 'user',
    }
  }, resDup);
  if (resDup.statusCode !== 400) {
    throw new Error(`Expected status 400 for duplicate email, got ${resDup.statusCode}`);
  }
  console.log('✅ TEST 3 PASSED: Duplicate registration rejected with 400:', resDup.data.message);

  // TEST 4: Invalid email format rejection
  console.log('\n[TEST 4] Testing invalid email rejection...');
  const resBadEmail = mockRes();
  await registerUser({
    body: {
      name: 'Bad Email User',
      email: 'not-an-email',
      password: 'password123',
    }
  }, resBadEmail);
  if (resBadEmail.statusCode !== 400) {
    throw new Error(`Expected status 400 for invalid email, got ${resBadEmail.statusCode}`);
  }
  console.log('✅ TEST 4 PASSED: Invalid email rejected with 400:', resBadEmail.data.message);

  // TEST 5: Short password rejection
  console.log('\n[TEST 5] Testing short password rejection...');
  const resShortPass = mockRes();
  await registerUser({
    body: {
      name: 'Short Pass User',
      email: 'shortpass@example.com',
      password: '123',
    }
  }, resShortPass);
  if (resShortPass.statusCode !== 400) {
    throw new Error(`Expected status 400 for short password, got ${resShortPass.statusCode}`);
  }
  console.log('✅ TEST 5 PASSED: Short password (<6 chars) rejected with 400:', resShortPass.data.message);

  // TEST 6: Login with exact credentials
  console.log('\n[TEST 6] Testing Login with exact credentials...');
  const resLogin = mockRes();
  await loginUser({
    body: {
      email: ` ${testEmail} `,
      password: testPassword,
    }
  }, resLogin);

  if (resLogin.statusCode !== 200) {
    throw new Error(`Login failed with status ${resLogin.statusCode}: ${JSON.stringify(resLogin.data)}`);
  }
  if (!resLogin.data.token || !resLogin.data.user) {
    throw new Error('Login response missing token or user');
  }
  if (resLogin.data.user.email !== testEmail || resLogin.data.user.name !== testName) {
    throw new Error('Login returned wrong user profile');
  }
  console.log('✅ TEST 6 PASSED: Login successful for:', resLogin.data.user.email, 'Role:', resLogin.data.user.role);

  // TEST 7: Login with wrong password
  console.log('\n[TEST 7] Testing Login with incorrect password...');
  const resWrongPass = mockRes();
  await loginUser({
    body: {
      email: testEmail,
      password: 'CompletelyWrongPassword!',
    }
  }, resWrongPass);
  if (resWrongPass.statusCode !== 401) {
    throw new Error(`Expected 401 for wrong password, got ${resWrongPass.statusCode}`);
  }
  console.log('✅ TEST 7 PASSED: Wrong password correctly rejected with 401:', resWrongPass.data.message);

  // TEST 8: Login with unregistered email
  console.log('\n[TEST 8] Testing Login with unregistered email...');
  const resUnknownEmail = mockRes();
  await loginUser({
    body: {
      email: 'nonexistent_account_9999@domain.com',
      password: 'password123',
    }
  }, resUnknownEmail);
  if (resUnknownEmail.statusCode !== 401) {
    throw new Error(`Expected 401 for unregistered email, got ${resUnknownEmail.statusCode}`);
  }
  console.log('✅ TEST 8 PASSED: Unregistered email rejected with 401:', resUnknownEmail.data.message);

  // TEST 9: JWT payload inspection
  console.log('\n[TEST 9] Verifying JWT token structure and claims...');
  const token = resLogin.data.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartpark_ai_super_secret_jwt_key_2026');
  if (decoded.id !== dbUser._id.toString()) {
    throw new Error(`Decoded JWT id ${decoded.id} does not match user id ${dbUser._id}`);
  }
  console.log('✅ TEST 9 PASSED: JWT verified. Payload contains id:', decoded.id, 'role:', decoded.role);

  // TEST 10: Get profile using authenticated user identity
  console.log('\n[TEST 10] Testing GET /api/users/profile...');
  const resProfile = mockRes();
  await getUserProfile({ user: dbUser }, resProfile);
  if (resProfile.statusCode !== 200 || !resProfile.data.user) {
    throw new Error('Failed to retrieve user profile');
  }
  if (resProfile.data.user.email !== testEmail) {
    throw new Error('Profile user email does not match');
  }
  console.log('✅ TEST 10 PASSED: Profile retrieved accurately:', resProfile.data.user.name, `(${resProfile.data.user.email})`);

  // TEST 11: Update profile and verify password stays intact
  console.log('\n[TEST 11] Updating profile (without touching password)...');
  const resUpdate = mockRes();
  await updateUserProfile({
    user: dbUser,
    body: {
      name: 'Marcus Vance Updated',
      vehicle: 'MH-12-ZZ-0001',
    }
  }, resUpdate);
  if (resUpdate.statusCode !== 200) {
    throw new Error('Profile update failed');
  }
  console.log('   Profile updated. Now verifying original password still authenticates...');
  const resLoginAfterUpdate = mockRes();
  await loginUser({
    body: {
      email: testEmail,
      password: testPassword,
    }
  }, resLoginAfterUpdate);
  if (resLoginAfterUpdate.statusCode !== 200) {
    throw new Error('CRITICAL BUG: Password was corrupted during profile update!');
  }
  console.log('✅ TEST 11 PASSED: Profile updated and login succeeds with original password!');

  // TEST 12: Register second user and verify isolation
  console.log('\n[TEST 12] Registering second user to verify data isolation...');
  const secondEmail = `owner_${timestamp}@parkingco.com`;
  const resOwnerReg = mockRes();
  await registerUser({
    body: {
      name: 'Elena Rostova',
      email: secondEmail,
      password: 'OwnerPassword456!',
      role: 'owner',
      phone: '+91 99999 11111',
    }
  }, resOwnerReg);
  if (resOwnerReg.statusCode !== 201) {
    throw new Error('Second user registration failed');
  }
  if (resOwnerReg.data.user.id === dbUser._id.toString()) {
    throw new Error('CRITICAL: Second user assigned same ID as first user!');
  }
  if (resOwnerReg.data.user.email === testEmail) {
    throw new Error('CRITICAL: Second user assigned first user email!');
  }
  console.log('✅ TEST 12 PASSED: Second user registered independently:', resOwnerReg.data.user.email, `(${resOwnerReg.data.user.role})`);

  console.log('\n====================================================');
  console.log('🎉 ALL 12 AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error('\n❌ AUTH TEST SUITE FAILED:', err);
  process.exit(1);
});
