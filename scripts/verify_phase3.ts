import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, RiskPrediction, Review } from '../src/models';
import { Server } from 'http';

const BASE_URL = 'http://localhost:5001/api';

async function runVerification() {
  console.log('====================================================');
  console.log('CODEDNA — PHASE 3 COMPREHENSIVE VERIFICATION SUITE');
  console.log('====================================================\n');

  await connectDatabase();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(5001, () => resolve(s));
  });

  const timestamp = Date.now();
  const userAEmail = `phase3_dev_a_${timestamp}@codedna.dev`;
  const userBEmail = `phase3_dev_b_${timestamp}@codedna.dev`;
  const password = 'Password123!';

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  const results: Record<string, 'PASS' | 'FAIL'> = {
    'Risk input': 'FAIL',
    'POST /api/risk/forecast': 'FAIL',
    'MongoDB persistence': 'FAIL',
    'Real UI values': 'FAIL',
    'Fake data removed': 'FAIL',
    'User isolation': 'FAIL',
  };

  try {
    // ----------------------------------------------------
    // 1. Register User A & Verify Initial Empty State
    // ----------------------------------------------------
    console.log('1. Registering User A & checking initial prediction state...');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Developer A', email: userAEmail, password }),
    });
    const regDataA: any = await regResA.json();
    if (!regDataA.success || !regDataA.data?.token) {
      throw new Error(`User A registration failed: ${JSON.stringify(regDataA)}`);
    }
    tokenA = regDataA.data.token;
    userAId = regDataA.data.user.id;

    // Check GET /api/risk for newly registered User A
    const getRiskResInitial = await fetch(`${BASE_URL}/risk`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getRiskInitial: any = await getRiskResInitial.json();
    console.log('Initial GET /api/risk response:', getRiskInitial);

    if (getRiskInitial.success && getRiskInitial.data === null) {
      console.log('✔ Initial risk prediction is null for fresh user (no fake fallback generated).');
      results['Fake data removed'] = 'PASS';
    } else {
      console.error('❌ Fake data still generated on empty user profile!');
    }

    // ----------------------------------------------------
    // 2. Error States Testing (empty code, unsupported lang)
    // ----------------------------------------------------
    console.log('\n2. Testing error handling (empty code & unsupported language)...');

    // 2a. Empty code
    const emptyCodeRes = await fetch(`${BASE_URL}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'empty.ts',
        sourceCode: '   ',
      }),
    });
    const emptyCodeData: any = await emptyCodeRes.json();
    console.log('Empty code response (status', emptyCodeRes.status, '):', emptyCodeData);

    // 2b. Unsupported language
    const badLangRes = await fetch(`${BASE_URL}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'brainfuck',
        fileName: 'app.bf',
        sourceCode: '++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]',
      }),
    });
    const badLangData: any = await badLangRes.json();
    console.log('Unsupported language response (status', badLangRes.status, '):', badLangData);

    if (
      emptyCodeRes.status === 400 &&
      emptyCodeData.success === false &&
      badLangRes.status === 400 &&
      badLangData.success === false
    ) {
      console.log('✔ Error states handled correctly with HTTP 400 and descriptive messages.');
      results['Risk input'] = 'PASS';
    }

    // ----------------------------------------------------
    // 3. Real Code Forecast: Clean Code
    // ----------------------------------------------------
    console.log('\n3. Testing clean code submission...');
    const cleanCode = `
export function calculateSum(numbers: number[]): number {
  if (!Array.isArray(numbers)) {
    return 0;
  }
  return numbers.reduce((acc, curr) => acc + curr, 0);
}
    `.trim();

    const cleanRes = await fetch(`${BASE_URL}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'math_utils.ts',
        sourceCode: cleanCode,
      }),
    });
    const cleanData: any = await cleanRes.json();
    console.log('Clean code forecast result:', {
      riskPercent: cleanData.data?.riskPercent,
      riskLevel: cleanData.data?.riskLevel,
      confidencePercent: cleanData.data?.confidencePercent,
      category: cleanData.data?.overallCategory,
    });

    // ----------------------------------------------------
    // 4. Real Code Forecast: Vulnerable Code (SQL injection)
    // ----------------------------------------------------
    console.log('\n4. Testing vulnerable code submission (SQL injection)...');
    const vulnerableCode = `
export async function authenticateUser(db: any, req: any) {
  const username = req.body.username;
  const password = req.body.password;
  // Dangerous SQL injection pattern
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const results = await db.query(sql);
  return results[0];
}
    `.trim();

    const vulnRes = await fetch(`${BASE_URL}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'auth_service.ts',
        sourceCode: vulnerableCode,
      }),
    });
    const vulnData: any = await vulnRes.json();
    console.log('Vulnerable code forecast result:', {
      riskPercent: vulnData.data?.riskPercent,
      riskLevel: vulnData.data?.riskLevel,
      confidencePercent: vulnData.data?.confidencePercent,
      primaryFactors: vulnData.data?.primaryFactors,
      diagnosticReasoning: vulnData.data?.diagnosticReasoning?.summary,
      recommendation: vulnData.data?.recommendation,
    });

    if (
      vulnRes.status === 200 &&
      vulnData.success &&
      vulnData.data?.riskPercent > cleanData.data?.riskPercent
    ) {
      console.log('✔ POST /api/risk/forecast returned real calculated values and detected elevated risk.');
      results['POST /api/risk/forecast'] = 'PASS';

      // Verify returned fields for Real UI values
      const d = vulnData.data;
      if (
        typeof d.riskPercent === 'number' &&
        typeof d.riskLevel === 'string' &&
        typeof d.confidencePercent === 'number' &&
        Array.isArray(d.primaryFactors) &&
        typeof d.recommendation === 'string' &&
        typeof d.diagnosticReasoning?.summary === 'string'
      ) {
        console.log('✔ All UI fields populated exclusively by real backend calculations.');
        results['Real UI values'] = 'PASS';
      }
    }

    // ----------------------------------------------------
    // 5. Persistence Verification (Simulate Page Refresh)
    // ----------------------------------------------------
    console.log('\n5. Verifying MongoDB persistence across page refresh...');
    const refreshRes = await fetch(`${BASE_URL}/risk`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const refreshData: any = await refreshRes.json();
    console.log('GET /api/risk after forecast:', {
      prNumber: refreshData.data?.prNumber,
      riskPercent: refreshData.data?.riskPercent,
      overallCategory: refreshData.data?.overallCategory,
    });

    if (
      refreshData.success &&
      refreshData.data?.prNumber === 'auth_service.ts' &&
      refreshData.data?.riskPercent === vulnData.data?.riskPercent
    ) {
      console.log('✔ Forecast persisted in MongoDB and verified on subsequent GET /api/risk.');
      results['MongoDB persistence'] = 'PASS';
    }

    // ----------------------------------------------------
    // 6. User Isolation Verification
    // ----------------------------------------------------
    console.log('\n6. Verifying User Isolation (User B cannot access User A data)...');
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Developer B', email: userBEmail, password }),
    });
    const regDataB: any = await regResB.json();
    tokenB = regDataB.data?.token;
    userBId = regDataB.data?.user?.id;

    // User B calls GET /api/risk
    const riskResB = await fetch(`${BASE_URL}/risk`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const riskDataB: any = await riskResB.json();
    console.log('User B GET /api/risk (initial):', riskDataB);

    let userBIsolated = riskDataB.success && riskDataB.data === null;

    // User B runs their own forecast
    await fetch(`${BASE_URL}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        language: 'python',
        fileName: 'helper.py',
        sourceCode: 'def greet(name):\n    return f"Hello {name}"\n',
      }),
    });

    const userBAfterRes = await fetch(`${BASE_URL}/risk`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBAfterData: any = await userBAfterRes.json();

    const userAAfterRes = await fetch(`${BASE_URL}/risk`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const userAAfterData: any = await userAAfterRes.json();

    console.log('User B active prediction:', userBAfterData.data?.prNumber);
    console.log('User A active prediction:', userAAfterData.data?.prNumber);

    if (
      userBIsolated &&
      userBAfterData.data?.prNumber === 'helper.py' &&
      userAAfterData.data?.prNumber === 'auth_service.ts'
    ) {
      console.log('✔ Complete user isolation verified. User B never touches User A prediction.');
      results['User isolation'] = 'PASS';
    }

  } finally {
    // Cleanup test users
    console.log('\nCleaning up test artifacts...');
    if (userAId) {
      await User.findByIdAndDelete(userAId);
      await RiskPrediction.deleteMany({ userId: userAId });
      await Review.deleteMany({ userId: userAId });
    }
    if (userBId) {
      await User.findByIdAndDelete(userBId);
      await RiskPrediction.deleteMany({ userId: userBId });
      await Review.deleteMany({ userId: userBId });
    }
    server.close();
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log('PHASE 3 VERIFICATION SUMMARY:');
  console.log('====================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val}`);
  }
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
