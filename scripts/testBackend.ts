import http from 'http';
import app from '../src/app';
import { generatePasscode, hashPasscode, isValidPasscodeFormat } from '../src/modules/reports/reports.helpers';

async function runTests() {
  console.log('🧪 =========================================');
  console.log('🧪 Starting CampusGuard Backend Verification');
  console.log('🧪 =========================================\n');

  // Test 1: Passcode Generation & Cryptographic Properties
  console.log('🔹 Test 1: Testing 16-Character Crockford Base32 Passcode Generator...');
  const passcodes = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const code = generatePasscode();
    if (code.length !== 16) {
      throw new Error(`Passcode length was not 16: ${code}`);
    }
    if (!isValidPasscodeFormat(code)) {
      throw new Error(`Passcode contains invalid Crockford Base32 chars: ${code}`);
    }
    passcodes.add(code);
  }
  if (passcodes.size !== 1000) {
    throw new Error('Collision detected in 1000 generated passcodes');
  }
  console.log('   ✅ Generated 1,000 distinct 16-character passcodes with 0 collisions & valid alphabet.');

  // Test 2: Passcode HMAC-SHA256 Hashing Properties
  console.log('\n🔹 Test 2: Testing HMAC Hashing Determinism and Normalization...');
  const samplePasscode = '3F9K7W2XZA1B4M6H';
  const hash1 = hashPasscode(samplePasscode);
  const hash2 = hashPasscode('  3f9k7w2xza1b4m6h  '); // Case and whitespace insensitivity
  if (hash1 !== hash2) {
    throw new Error(`HMAC hashes did not match across normalized casing: ${hash1} vs ${hash2}`);
  }
  if (hash1.length !== 64) {
    throw new Error(`Expected 64-char SHA256 hex string, got length ${hash1.length}`);
  }
  console.log(`   ✅ HMAC Determinism verified. Sample: "${samplePasscode}" -> ${hash1.slice(0, 16)}... (64 hex chars)`);

  // Test 3: Spin up ephemeral test server to verify Express API Routes & Middleware
  console.log('\n🔹 Test 3: Verifying HTTP Server Endpoints & Error Envelopes...');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number; address: string };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`   📡 Ephemeral test server listening on ${baseUrl}`);

  try {
    // 3a. Health Check
    const resHealth = await fetch(`${baseUrl}/`);
    const healthJson = await resHealth.json() as { success: boolean; message: string };
    if (resHealth.status !== 200 || !healthJson.success) {
      throw new Error(`Health check failed with status ${resHealth.status}`);
    }
    console.log('   ✅ GET / returned 200 OK with server health envelope.');

    // 3b. 404 Route Not Found
    const res404 = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`);
    const json404 = await res404.json() as { success: boolean; message: string };
    if (res404.status !== 404 || json404.success !== false) {
      throw new Error(`404 route handling failed: ${JSON.stringify(json404)}`);
    }
    console.log('   ✅ GET /api/v1/non-existent-endpoint correctly returned 404 envelope.');

    // 3c. Protected Route Without Token (GET /api/v1/reports/all)
    const resProtected = await fetch(`${baseUrl}/api/v1/reports/all`);
    const jsonProtected = await resProtected.json() as { success: boolean; message: string };
    if (resProtected.status !== 401 || jsonProtected.success !== false) {
      throw new Error(`Protected route did not reject unauthenticated request: ${resProtected.status}`);
    }
    console.log('   ✅ GET /api/v1/reports/all correctly rejected unauthenticated request with 401 Unauthorized.');

    // 3d. Anonymous Report Submission Validation (Short description error)
    const resCreateBad = await fetch(`${baseUrl}/api/v1/reports/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'RAGGING', description: 'too short' }),
    });
    const jsonCreateBad = await resCreateBad.json() as { success: boolean; message: string };
    if (resCreateBad.status !== 400 || jsonCreateBad.success !== false) {
      throw new Error(`Short description validation did not return 400: ${JSON.stringify(jsonCreateBad)}`);
    }
    console.log('   ✅ POST /api/v1/reports/create rejected short description with 400 Bad Request.');

    // 3e. Tracking with invalid passcode format
    const resTrackBad = await fetch(`${baseUrl}/api/v1/reports/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'SHORT' }),
    });
    const jsonTrackBad = await resTrackBad.json() as { success: boolean; message: string };
    if (resTrackBad.status !== 404 || jsonTrackBad.success !== false) {
      throw new Error(`Invalid passcode did not return 404: ${JSON.stringify(jsonTrackBad)}`);
    }
    console.log('   ✅ POST /api/v1/reports/track rejected invalid passcode format with uniform 404 envelope.');

    // 3f. Authority Login with missing fields
    const resLoginBad = await fetch(`${baseUrl}/api/v1/authorities/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });
    const jsonLoginBad = await resLoginBad.json() as { success: boolean; message: string };
    if (resLoginBad.status !== 400 || jsonLoginBad.success !== false) {
      throw new Error(`Empty login did not return 400: ${JSON.stringify(jsonLoginBad)}`);
    }
    console.log('   ✅ POST /api/v1/authorities/login rejected empty credentials with 400 Bad Request.');

    console.log('\n🎉 ==============================================');
    console.log('🎉 ALL BACKEND SPECIFICATION & ARCHITECTURE TESTS PASSED');
    console.log('🎉 ==============================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
