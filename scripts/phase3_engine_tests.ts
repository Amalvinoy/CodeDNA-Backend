import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review } from '../src/models';
import bcrypt from 'bcryptjs';

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function runPhase3Tests() {
  console.log('🧪 Starting Code DNA Phase 3 Multi-Language Review Engine Tests...\n');

  await connectDatabase();

  const userAEmail = `test_engineer_${Date.now()}@codedna.dev`;
  const userBEmail = `test_attacker_${Date.now()}@codedna.dev`;

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  try {
    // 0. Setup Test Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const userA = await User.create({
      name: 'Alice Architect',
      email: userAEmail,
      passwordHash,
      role: 'user',
    });
    userAId = userA._id.toString();

    const userB = await User.create({
      name: 'Bob Attacker',
      email: userBEmail,
      passwordHash,
      role: 'user',
    });
    userBId = userB._id.toString();

    // Login User A
    const loginResA = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'password123' }),
    });
    const loginDataA: any = await loginResA.json();
    tokenA = loginDataA.data.token;

    // Login User B
    const loginResB = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: 'password123' }),
    });
    const loginDataB: any = await loginResB.json();
    tokenB = loginDataB.data.token;

    let reviewPythonId = '';
    let reviewJsId = '';
    let reviewTsId = '';

    // ----------------------------------------------------
    // TEST 1: Valid Python Review
    // ----------------------------------------------------
    console.log('--- TEST 1: Valid Python Review Submission ---');
    const pyCode = `
def get_user_data(user_id, cache={}):
    # Mutable default argument & SQL injection
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    return db.execute(query)
`;
    const res1 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'python',
        fileName: 'user_service.py',
        sourceCode: pyCode,
      }),
    });
    const data1: any = await res1.json();
    console.log(`Status: ${res1.status}, Quality Score: ${data1.data?.qualityScore}`);
    console.log(`Findings detected: ${data1.data?.findings?.length}`);
    if (res1.status === 201 && data1.success && data1.data?.language === 'python' && data1.data?.findings?.length > 0) {
      console.log('✅ TEST 1 PASSED: Python review analyzed and stored with line-level findings.');
      reviewPythonId = data1.data.reviewIdString || data1.data.id;
    } else {
      throw new Error(`❌ TEST 1 FAILED: ${JSON.stringify(data1)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Valid JavaScript Review
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Valid JavaScript Review Submission ---');
    const jsCode = `
function evaluateFormula(userInput) {
    // eval vulnerability and innerHTML XSS
    const result = eval(userInput);
    document.getElementById("output").innerHTML = result;
    return result;
}
`;
    const res2 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'javascript',
        fileName: 'calculator.js',
        sourceCode: jsCode,
      }),
    });
    const data2: any = await res2.json();
    console.log(`Status: ${res2.status}, Score: ${data2.data?.qualityScore}`);
    console.log(`Findings detected: ${data2.data?.findings?.length}`);
    if (res2.status === 201 && data2.success && data2.data?.criticalCount > 0) {
      console.log('✅ TEST 2 PASSED: JavaScript review detected critical eval and XSS vulnerabilities.');
      reviewJsId = data2.data.reviewIdString || data2.data.id;
    } else {
      throw new Error(`❌ TEST 2 FAILED: ${JSON.stringify(data2)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Valid TypeScript Review
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Valid TypeScript Review Submission ---');
    const tsCode = `
export interface UserPayload {
    id: string;
}

export function parseUser(data: any): UserPayload {
    const user = data as any;
    return { id: user!.id };
}
`;
    const res3 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'userParser.ts',
        sourceCode: tsCode,
      }),
    });
    const data3: any = await res3.json();
    console.log(`Status: ${res3.status}, Score: ${data3.data?.qualityScore}`);
    if (res3.status === 201 && data3.success && data3.data?.language === 'typescript') {
      console.log('✅ TEST 3 PASSED: TypeScript review analyzed successfully.');
      reviewTsId = data3.data.reviewIdString || data3.data.id;
    } else {
      throw new Error(`❌ TEST 3 FAILED: ${JSON.stringify(data3)}`);
    }

    // ----------------------------------------------------
    // TEST 4: Unsupported Language Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Unsupported Language Validation ---');
    const res4 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'brainfuck_unsupported',
        sourceCode: '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]',
      }),
    });
    const data4: any = await res4.json();
    console.log(`Status: ${res4.status}, Error Message: ${data4.message}`);
    if (res4.status === 400 && !data4.success && data4.message.includes('Unsupported programming language')) {
      console.log('✅ TEST 4 PASSED: Unsupported language rejected with clean 400 error.');
    } else {
      throw new Error(`❌ TEST 4 FAILED: ${JSON.stringify(data4)}`);
    }

    // ----------------------------------------------------
    // TEST 5: Empty Source Code Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Empty Source Code Validation ---');
    const res5 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'python',
        sourceCode: '   ',
      }),
    });
    const data5: any = await res5.json();
    console.log(`Status: ${res5.status}, Error Message: ${data5.message}`);
    if (res5.status === 400 && !data5.success) {
      console.log('✅ TEST 5 PASSED: Empty source code rejected with 400.');
    } else {
      throw new Error(`❌ TEST 5 FAILED: ${JSON.stringify(data5)}`);
    }

    // ----------------------------------------------------
    // TEST 6: Oversized Code Rejection (>500KB)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Oversized Code Rejection ---');
    const oversizedCode = 'console.log("giant payload");\n'.repeat(25000); // >600KB
    const res6 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'javascript',
        sourceCode: oversizedCode,
      }),
    });
    const data6: any = await res6.json();
    console.log(`Status: ${res6.status}, Error Message: ${data6.message}`);
    if (res6.status === 400 && !data6.success && data6.message.includes('exceeds maximum')) {
      console.log('✅ TEST 6 PASSED: Oversized source code rejected safely.');
    } else {
      throw new Error(`❌ TEST 6 FAILED: ${JSON.stringify(data6)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Unauthenticated Submission (401)
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Unauthenticated Submission ---');
    const res7 = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        sourceCode: 'print("hello")',
      }),
    });
    const data7: any = await res7.json();
    console.log(`Status: ${res7.status}`);
    if (res7.status === 401 && !data7.success) {
      console.log('✅ TEST 7 PASSED: Unauthenticated request rejected with 401 Unauthorized.');
    } else {
      throw new Error(`❌ TEST 7 FAILED: ${JSON.stringify(data7)}`);
    }

    // ----------------------------------------------------
    // TEST 8: User A Attempts to Access User B's Review (Authorization Isolation)
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Cross-User Review Access Isolation ---');
    // User B attempts to access User A's Python review
    const res8 = await fetch(`${API_BASE}/reviews/${reviewPythonId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const data8: any = await res8.json();
    console.log(`User B query status for User A review: ${res8.status}`);
    if (res8.status === 404 || res8.status === 403 || !data8.success) {
      console.log('✅ TEST 8 PASSED: User B cannot access User A review data.');
    } else {
      throw new Error(`❌ TEST 8 FAILED: User B successfully accessed User A review!`);
    }

    // ----------------------------------------------------
    // TEST 9: Authenticated User Retrieval of Own Review
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Authenticated User Retrieval of Own Review ---');
    const res9 = await fetch(`${API_BASE}/reviews/${reviewPythonId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data9: any = await res9.json();
    console.log(`Status: ${res9.status}, Retrieved reviewId: ${data9.data?.reviewIdString || data9.data?._id}`);
    if (res9.status === 200 && data9.success && data9.data?.findings?.length > 0) {
      console.log('✅ TEST 9 PASSED: User A retrieved own review with full structured findings.');
    } else {
      throw new Error(`❌ TEST 9 FAILED: ${JSON.stringify(data9)}`);
    }

    // ----------------------------------------------------
    // TEST 10: Review Deletion Authorization
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Review Deletion Authorization ---');
    // User B attempts to delete User A's review (Must Fail)
    const resDeleteB = await fetch(`${API_BASE}/reviews/${reviewPythonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataDeleteB: any = await resDeleteB.json();
    console.log(`User B delete attempt status: ${resDeleteB.status}`);

    // User A deletes own review (Must Succeed)
    const resDeleteA = await fetch(`${API_BASE}/reviews/${reviewPythonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataDeleteA: any = await resDeleteA.json();
    console.log(`User A delete attempt status: ${resDeleteA.status}`);

    if (resDeleteB.status === 404 && resDeleteA.status === 200 && dataDeleteA.success) {
      console.log('✅ TEST 10 PASSED: Review deletion strictly protected by user ownership.');
    } else {
      throw new Error(`❌ TEST 10 FAILED: Deletion authorization check failed.`);
    }

    console.log('\n🎉 ALL 10 PHASE 3 CORE ENGINE TESTS PASSED PERFECTLY!\n');
  } finally {
    // Cleanup test users
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await Review.deleteMany({ userId: { $in: [userAId, userBId] } });
    await disconnectDatabase();
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal Engine Test Error:', err);
  process.exit(1);
});
