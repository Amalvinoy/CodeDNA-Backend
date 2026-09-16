import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review, CodeDNA, RiskPrediction, CodeBattle } from '../src/models';
import { DnaService } from '../src/services/dna.service';
import bcrypt from 'bcryptjs';

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function runPhase6Tests() {
  console.log('🧪 Starting Code DNA Phase 6 Predictive Risk & Code Battle Tests...\n');

  await connectDatabase();

  const userAEmail = `risk_dev_${Date.now()}@codedna.dev`;
  const userBEmail = `risk_intruder_${Date.now()}@codedna.dev`;

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  try {
    // 0. Setup Test Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const userA = await User.create({
      name: 'Ada Lovelace',
      email: userAEmail,
      passwordHash,
      role: 'user',
    });
    userAId = userA._id.toString();

    const userB = await User.create({
      name: 'Intruder Bob',
      email: userBEmail,
      passwordHash,
      role: 'user',
    });
    userBId = userB._id.toString();

    const loginResA = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'password123' }),
    });
    const loginDataA: any = await loginResA.json();
    tokenA = loginDataA.data.token;

    const loginResB = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: 'password123' }),
    });
    const loginDataB: any = await loginResB.json();
    tokenB = loginDataB.data.token;

    // ----------------------------------------------------
    // TEST 1: Risk Forecast with Insufficient History (0 Reviews)
    // ----------------------------------------------------
    console.log('--- TEST 1: Generic Risk Forecast with Insufficient History ---');
    const nPlusOneCode = `
export async function loadUsers(ids: string[]) {
  const users = [];
  for (const id of ids) {
    const u = await db.query(\`SELECT * FROM users WHERE id = \${id}\`);
    users.push(u);
  }
  return users;
}
`;
    const resForecast1 = await fetch(`${API_BASE}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'loadUsers.ts',
        sourceCode: nPlusOneCode,
      }),
    });

    const dataForecast1: any = await resForecast1.json();
    console.log(`Forecast 1 Status: ${resForecast1.status}, Risk Level: ${dataForecast1.data?.overallRiskLevel}, Personalization: ${dataForecast1.data?.personalization}`);

    if (
      resForecast1.status === 200 &&
      (dataForecast1.data?.overallRiskLevel === 'HIGH' || dataForecast1.data?.overallRiskLevel === 'MEDIUM' || dataForecast1.data?.overallRiskLevel === 'CRITICAL') &&
      dataForecast1.data?.personalization === 'insufficient_history'
    ) {
      console.log('✅ TEST 1 PASSED: Code risk identified and marked as insufficient_history for new user.');
    } else {
      throw new Error(`❌ TEST 1 FAILED: Unexpected risk forecast response.`);
    }

    // ----------------------------------------------------
    // TEST 2: Clean Code Risk Forecast (Low Risk)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Clean Code Risk Forecast ---');
    const cleanCode = `
export function addNumbers(a: number, b: number): number {
  return a + b;
}
`;
    const resForecastClean = await fetch(`${API_BASE}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'math.ts',
        sourceCode: cleanCode,
      }),
    });

    const dataForecastClean: any = await resForecastClean.json();
    console.log(`Clean Code Risk: ${dataForecastClean.data?.overallRiskLevel} (${dataForecastClean.data?.overallRiskPercent}%)`);

    if (resForecastClean.status === 200 && dataForecastClean.data?.overallRiskLevel === 'LOW') {
      console.log('✅ TEST 2 PASSED: Clean code accurately receives LOW risk forecast.');
    } else {
      throw new Error(`❌ TEST 2 FAILED: Clean code did not receive low risk.`);
    }

    // ----------------------------------------------------
    // TEST 3: Personalized Risk Forecast (Historical Reviews & DNA)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Personalized Risk Forecast with Recurring Pattern Evidence ---');
    // Seed 3 reviews with performance.n_plus_one weakness
    for (let i = 1; i <= 3; i++) {
      await Review.create({
        userId: userAId,
        reviewIdString: `REV-HIST-${i}-${Date.now()}`,
        fileName: `data_fetcher_v${i}.ts`,
        language: 'typescript',
        sourceCode: nPlusOneCode,
        status: 'completed',
        qualityScore: 6.0,
        aiSummary: 'N+1 query in loop',
        findings: [
          {
            id: `f-n1-${i}`,
            category: 'performance',
            severity: 'high',
            title: 'N+1 database query in loop',
            description: 'Repeated query in loop',
            lineStart: 4,
            lineEnd: 4,
            codeSnippet: 'await db.query',
            whyItMatters: 'Database round-trip latency',
            suggestedFix: 'Batch query',
            confidence: 0.95,
          },
        ],
        metrics: { correctness: 8.0, security: 8.0, performance: 5.5, architecture: 7.5, maintainability: 8.0 },
      });
    }

    // Recalculate DNA
    await DnaService.calculateAndSaveDNA(userAId);

    // Re-run risk forecast on performance-heavy code
    const resForecastPersonal = await fetch(`${API_BASE}/risk/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'userProfiles.ts',
        sourceCode: nPlusOneCode,
      }),
    });

    const dataForecastPersonal: any = await resForecastPersonal.json();
    console.log(`Personalized Risk: ${dataForecastPersonal.data?.overallRiskLevel} (${dataForecastPersonal.data?.overallRiskPercent}%), Personalization: ${dataForecastPersonal.data?.personalization}, Confidence: ${dataForecastPersonal.data?.confidencePercent}%`);
    console.log(`Evidence items: ${dataForecastPersonal.data?.evidence?.length}`);

    const hasDeveloperPatternEvidence = dataForecastPersonal.data?.evidence?.some(
      (e: any) => e.type === 'developer_pattern'
    );

    if (
      dataForecastPersonal.data?.personalization === 'personalized' &&
      dataForecastPersonal.data?.confidencePercent >= 80 &&
      hasDeveloperPatternEvidence
    ) {
      console.log('✅ TEST 3 PASSED: Personalized risk forecast amplified by developer recurring weakness.');
    } else {
      throw new Error(`❌ TEST 3 FAILED: Personalized risk forecast missing developer pattern evidence.`);
    }

    // ----------------------------------------------------
    // TEST 4: Integrated Review Creation with Risk Forecast Storage
    // ----------------------------------------------------
    console.log('\n--- TEST 4: End-to-End Review Creation with Integrated Risk Forecast ---');
    const resReview = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'service.ts',
        sourceCode: nPlusOneCode,
      }),
    });

    const dataReview: any = await resReview.json();
    console.log(`Review Created: ${dataReview.data?.reviewIdString}, Quality: ${dataReview.data?.qualityScore}`);
    console.log(`Stored Review Risk Forecast: ${dataReview.data?.riskForecast?.overallRisk} (${dataReview.data?.riskForecast?.riskPercent}%)`);

    if (resReview.status === 201 && dataReview.data?.riskForecast?.overallRisk) {
      console.log('✅ TEST 4 PASSED: Review document saved with integrated risk forecast.');
    } else {
      throw new Error(`❌ TEST 4 FAILED: Review creation missing riskForecast field.`);
    }

    // ----------------------------------------------------
    // TEST 5: GET /api/risk & User Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: GET /api/risk & User Isolation ---');
    const resRiskA = await fetch(`${API_BASE}/risk`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataRiskA: any = await resRiskA.json();

    const resRiskB = await fetch(`${API_BASE}/risk`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataRiskB: any = await resRiskB.json();

    console.log(`User A Risk Level: ${dataRiskA.data?.riskLevel}, Factors: ${dataRiskA.data?.primaryFactors?.length}`);
    console.log(`User B Risk Level: ${dataRiskB.data?.riskLevel}, Score: ${dataRiskB.data?.riskPercent}%`);

    if (resRiskA.status === 200 && resRiskB.status === 200 && dataRiskA.data?.userId === userAId) {
      console.log('✅ TEST 5 PASSED: Predictive risk endpoint strictly scoped to authenticated user.');
    } else {
      throw new Error(`❌ TEST 5 FAILED: Risk authorization isolation failed.`);
    }

    // ----------------------------------------------------
    // TEST 6: Code Battle Generation & Shared Pipeline Evaluation
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Code Battle Generation & Side-by-Side Evaluation ---');
    const resBattleGen = await fetch(`${API_BASE}/battle/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        file: 'userQueries.ts',
        language: 'typescript',
        originalCode: nPlusOneCode,
      }),
    });

    const dataBattleGen: any = await resBattleGen.json();
    console.log(`Original Score: ${dataBattleGen.data?.originalScore}/10.0, Optimized Score: ${dataBattleGen.data?.optimizedScore}/10.0`);
    console.log(`Security: ${dataBattleGen.data?.metrics?.security?.original} -> ${dataBattleGen.data?.metrics?.security?.optimized}`);
    console.log(`Performance: ${dataBattleGen.data?.metrics?.performance?.original} -> ${dataBattleGen.data?.metrics?.performance?.optimized}`);

    if (
      resBattleGen.status === 200 &&
      dataBattleGen.data?.optimizedScore > dataBattleGen.data?.originalScore &&
      dataBattleGen.data?.optimizedCode.length > 0
    ) {
      console.log('✅ TEST 6 PASSED: Code Battle successfully evaluated both candidate versions on the shared engine.');
    } else {
      throw new Error(`❌ TEST 6 FAILED: Code battle evaluation failed.`);
    }

    // ----------------------------------------------------
    // TEST 7: Code Battle Defense Submission
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Code Battle Defense Submission ---');
    const resDefense = await fetch(`${API_BASE}/battle/defense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        reasoning: 'Sequential iteration is intentionally chosen for small in-memory arrays to avoid bulk allocation overhead.',
      }),
    });

    const dataDefense: any = await resDefense.json();
    console.log(`Defense Status: ${resDefense.status}, Awarded: ${dataDefense.data?.pointsAwarded} XP`);

    if (resDefense.status === 200 && dataDefense.success && dataDefense.data?.pointsAwarded > 0) {
      console.log('✅ TEST 7 PASSED: Engineer defense successfully processed.');
    } else {
      throw new Error(`❌ TEST 7 FAILED: Defense submission failed.`);
    }

    // ----------------------------------------------------
    // TEST 8: GET /api/battle & Authorization Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 8: GET /api/battle & Authorization Isolation ---');
    const resBattleA = await fetch(`${API_BASE}/battle`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataBattleA: any = await resBattleA.json();

    const resBattleB = await fetch(`${API_BASE}/battle`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataBattleB: any = await resBattleB.json();

    console.log(`User A Battle File: ${dataBattleA.data?.file}`);
    console.log(`User B Battle File: ${dataBattleB.data?.file}`);

    if (resBattleA.status === 200 && resBattleB.status === 200 && dataBattleA.data?.userId === userAId) {
      console.log('✅ TEST 8 PASSED: Code Battle state isolated per user.');
    } else {
      throw new Error(`❌ TEST 8 FAILED: Battle endpoint isolation failed.`);
    }

    console.log('\n🎉 ALL PHASE 6 PREDICTIVE RISK & CODE BATTLE TESTS PASSED PERFECTLY!\n');
  } finally {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await Review.deleteMany({ userId: { $in: [userAId, userBId] } });
    await CodeDNA.deleteMany({ userId: { $in: [userAId, userBId] } });
    await RiskPrediction.deleteMany({ userId: { $in: [userAId, userBId] } });
    await CodeBattle.deleteMany({ userId: { $in: [userAId, userBId] } });
    await disconnectDatabase();
  }
}

runPhase6Tests().catch((err) => {
  console.error('Fatal Phase 6 Test Error:', err);
  process.exit(1);
});
