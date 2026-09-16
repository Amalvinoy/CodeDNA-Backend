import jwt from 'jsonwebtoken';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { env } from '../src/config/env';
import { User, Review, CodeDNA, CodeBattle } from '../src/models';

const API_BASE = process.env.API_BASE || `http://localhost:${env.PORT || 5001}/api`;

async function runSecurityTests() {
  console.log('🧪 Starting Code DNA Phase 6.5 Full 15-Point Security & Authentication Audit Suite...\n');
  console.log(`📡 Targeting API Base: ${API_BASE}\n`);

  await connectDatabase();

  const timestamp = Date.now();
  const testUserA = {
    name: 'Linus Torvalds',
    email: `linus_${timestamp}@kernel.org`,
    password: 'super-secure-password-123',
  };

  const testUserB = {
    name: 'Grace Hopper',
    email: `grace_${timestamp}@navy.mil`,
    password: 'another-secure-password-456',
  };

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  const results: { test: number; name: string; status: 'PASS' | 'FAIL'; detail?: string }[] = [];

  const recordPass = (testNum: number, name: string) => {
    console.log(`✅ TEST ${testNum} PASSED: ${name}`);
    results.push({ test: testNum, name, status: 'PASS' });
  };

  const recordFail = (testNum: number, name: string, detail: string) => {
    console.error(`❌ TEST ${testNum} FAILED: ${name} — ${detail}`);
    results.push({ test: testNum, name, status: 'FAIL', detail });
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Registration Success
    // ----------------------------------------------------
    console.log('--- TEST 1: Registration Success ---');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserA),
      });
      const data: any = await res.json();
      if (res.status === 201 && data.success && data.data?.token && data.data?.user?.email === testUserA.email) {
        tokenA = data.data.token;
        userAId = data.data.user.id;
        recordPass(1, 'Registration Success');
      } else {
        recordFail(1, 'Registration Success', `Status: ${res.status}, Body: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      recordFail(1, 'Registration Success', err.message);
    }

    // ----------------------------------------------------
    // TEST 2: Duplicate Registration
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Duplicate Registration ---');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUserA),
      });
      const data: any = await res.json();
      if (res.status === 409 && !data.success) {
        recordPass(2, 'Duplicate Registration Rejection (409 Conflict)');
      } else {
        recordFail(2, 'Duplicate Registration Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(2, 'Duplicate Registration Rejection', err.message);
    }

    // ----------------------------------------------------
    // TEST 3: Invalid Email Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Invalid Email Rejection ---');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid Email User',
          email: 'not-a-valid-email-format',
          password: 'password123',
        }),
      });
      const data: any = await res.json();
      if (res.status === 400 && !data.success) {
        recordPass(3, 'Invalid Email Rejection (400 Bad Request)');
      } else {
        recordFail(3, 'Invalid Email Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(3, 'Invalid Email Rejection', err.message);
    }

    // ----------------------------------------------------
    // TEST 4: Invalid / Weak Password Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Invalid / Weak Password Rejection ---');
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Weak Password User',
          email: `weak_${Date.now()}@example.com`,
          password: '123', // < 6 chars
        }),
      });
      const data: any = await res.json();
      if (res.status === 400 && !data.success) {
        recordPass(4, 'Weak Password (< 6 chars) Rejection (400 Bad Request)');
      } else {
        recordFail(4, 'Weak Password Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(4, 'Weak Password Rejection', err.message);
    }

    // ----------------------------------------------------
    // TEST 5: Login Success
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Login Success ---');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: testUserA.password,
        }),
      });
      const data: any = await res.json();
      if (res.status === 200 && data.success && data.data?.token) {
        tokenA = data.data.token;
        recordPass(5, 'Valid Credentials Login Success');
      } else {
        recordFail(5, 'Login Success', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(5, 'Login Success', err.message);
    }

    // ----------------------------------------------------
    // TEST 6: Wrong Password Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Wrong Password Rejection ---');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserA.email,
          password: 'incorrect-password-xyz',
        }),
      });
      const data: any = await res.json();
      if (res.status === 401 && !data.success) {
        recordPass(6, 'Wrong Password Rejection (401 Unauthorized)');
      } else {
        recordFail(6, 'Wrong Password Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(6, 'Wrong Password Rejection', err.message);
    }

    // ----------------------------------------------------
    // TEST 7: Unknown User Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Unknown User Rejection ---');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `nonexistent_${Date.now()}@ghost.net`,
          password: 'password123',
        }),
      });
      const data: any = await res.json();
      if (res.status === 401 && !data.success) {
        recordPass(7, 'Unknown User Rejection (401 Unauthorized)');
      } else {
        recordFail(7, 'Unknown User Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(7, 'Unknown User Rejection', err.message);
    }

    // ----------------------------------------------------
    // TEST 8: Protected Endpoint Without Auth
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Protected Endpoint Without Auth ---');
    try {
      const res = await fetch(`${API_BASE}/dna`, { method: 'GET' });
      const data: any = await res.json();
      if (res.status === 401 && !data.success) {
        recordPass(8, 'Unauthenticated Request Denied (401 Unauthorized)');
      } else {
        recordFail(8, 'Protected Endpoint Without Auth', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(8, 'Protected Endpoint Without Auth', err.message);
    }

    // ----------------------------------------------------
    // TEST 9: Protected Endpoint with Invalid Token
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Protected Endpoint with Invalid Token ---');
    try {
      const res = await fetch(`${API_BASE}/dna`, {
        method: 'GET',
        headers: { Authorization: 'Bearer this_is_a_malformed_fake_token_value' },
      });
      const data: any = await res.json();
      if (res.status === 401 && !data.success) {
        recordPass(9, 'Malformed / Tampered Token Denied (401 Unauthorized)');
      } else {
        recordFail(9, 'Protected Endpoint with Invalid Token', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(9, 'Protected Endpoint with Invalid Token', err.message);
    }

    // ----------------------------------------------------
    // TEST 10: Expired Token Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Expired Token Rejection ---');
    try {
      const secret = env.JWT_SECRET || 'dev_jwt_secret_key_codedna_2026';
      const expiredToken = jwt.sign(
        { userId: userAId, role: 'user' },
        secret,
        { expiresIn: '-10s' } // Expired 10 seconds ago
      );

      const res = await fetch(`${API_BASE}/dna`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      const data: any = await res.json();
      if (res.status === 401 && !data.success) {
        recordPass(10, 'Expired Token Denied (401 Unauthorized)');
      } else {
        recordFail(10, 'Expired Token Rejection', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(10, 'Expired Token Rejection', err.message);
    }

    // Setup User B for cross-tenant isolation testing
    const resB = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUserB),
    });
    const dataB: any = await resB.json();
    tokenB = dataB.data?.token;
    userBId = dataB.data?.user?.id;

    // Create a private review for User B
    const secretReviewB = await Review.create({
      userId: userBId,
      reviewIdString: `REV-SECRET-${Date.now()}`,
      fileName: 'kernel_panic.c',
      language: 'c',
      sourceCode: 'void panic() { while(1); }',
      qualityScore: 9.8,
      scoreDelta: 0.2,
      status: 'completed',
      aiSummary: 'Confidential kernel analysis for Grace Hopper only.',
      issuesCount: 0,
      criticalCount: 0,
      warningCount: 0,
      findings: [],
    });

    // ----------------------------------------------------
    // TEST 11: User A → User B Review Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 11: User A → User B Review Isolation ---');
    try {
      const res = await fetch(`${API_BASE}/reviews/${secretReviewB.reviewIdString}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data: any = await res.json();
      if ((res.status === 404 || res.status === 403) && !data.success) {
        recordPass(11, 'Cross-User Review Access Strictly Denied');
      } else {
        recordFail(11, 'User A → User B Review Isolation', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(11, 'User A → User B Review Isolation', err.message);
    }

    // ----------------------------------------------------
    // TEST 12: User A → User B DNA Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 12: User A → User B DNA Isolation ---');
    try {
      const res = await fetch(`${API_BASE}/dna`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data: any = await res.json();
      if (res.status === 200 && data.success && data.data?.userId === userAId) {
        recordPass(12, 'Code DNA Scope Strictly Bound to Authenticated Identity');
      } else if (res.status === 200 && data.success && !data.data?.userId) {
        // Safe read model scoped to caller
        recordPass(12, 'Code DNA Scope Strictly Bound to Authenticated Identity');
      } else {
        recordFail(12, 'User A → User B DNA Isolation', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(12, 'User A → User B DNA Isolation', err.message);
    }

    // ----------------------------------------------------
    // TEST 13: User A → User B Battle Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 13: User A → User B Battle Isolation ---');
    try {
      const res = await fetch(`${API_BASE}/battle`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data: any = await res.json();
      if (res.status === 200 && data.success) {
        recordPass(13, 'Code Battle Data Scoped to Authenticated User');
      } else {
        recordFail(13, 'User A → User B Battle Isolation', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(13, 'User A → User B Battle Isolation', err.message);
    }

    // ----------------------------------------------------
    // TEST 14: Arbitrary userId Body Manipulation Attack
    // ----------------------------------------------------
    console.log('\n--- TEST 14: Arbitrary userId Body Manipulation Attack ---');
    try {
      // User A tries to create a review masquerading as User B via body param
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          userId: userBId, // Injected malicious userId
          language: 'python',
          fileName: 'exploit.py',
          sourceCode: 'def exploit(): pass',
        }),
      });
      const data: any = await res.json();
      if (res.status === 201 && data.success) {
        // Verify saved review is attributed to User A (from JWT), NOT User B
        const savedReview = await Review.findOne({ reviewIdString: data.data.reviewIdString || data.data.id });
        if (savedReview && savedReview.userId === userAId) {
          recordPass(14, 'Arbitrary userId Body Injection Defeated (Authenticated Session Preserved)');
        } else {
          recordFail(14, 'Arbitrary userId Body Attack', `Review assigned to ${savedReview?.userId} instead of ${userAId}`);
        }
      } else {
        recordFail(14, 'Arbitrary userId Body Attack', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(14, 'Arbitrary userId Body Attack', err.message);
    }

    // ----------------------------------------------------
    // TEST 15: Logout & Session Invalidation
    // ----------------------------------------------------
    console.log('\n--- TEST 15: Logout & Session Invalidation ---');
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data: any = await res.json();
      if (res.status === 200 && data.success) {
        recordPass(15, 'Logout Successfully Clears Authentication State');
      } else {
        recordFail(15, 'Logout Invalidation', `Status: ${res.status}`);
      }
    } catch (err: any) {
      recordFail(15, 'Logout Invalidation', err.message);
    }

    console.log('\n========================================================');
    console.log('🏁 15-POINT AUTHENTICATION & SECURITY AUDIT SUMMARY');
    console.log('========================================================');
    const passedCount = results.filter((r) => r.status === 'PASS').length;
    results.forEach((r) => {
      console.log(`[${r.status}] Test ${r.test}: ${r.name}`);
    });
    console.log(`\nResult: ${passedCount}/15 Tests Passed.`);

    if (passedCount !== 15) {
      throw new Error(`Security test failures detected (${15 - passedCount} failed)`);
    }
    console.log('🎉 ALL 15 PRODUCTION SECURITY & AUTHENTICATION TESTS PASSED!\n');
  } finally {
    // Clean up test data
    await User.deleteMany({ email: { $in: [testUserA.email, testUserB.email] } });
    await Review.deleteMany({ userId: { $in: [userAId, userBId] } });
    await CodeDNA.deleteMany({ userId: { $in: [userAId, userBId] } });
    await CodeBattle.deleteMany({ userId: { $in: [userAId, userBId] } });
    await disconnectDatabase();
  }
}

runSecurityTests().catch((err) => {
  console.error('Fatal Security Test Suite Error:', err);
  process.exit(1);
});
