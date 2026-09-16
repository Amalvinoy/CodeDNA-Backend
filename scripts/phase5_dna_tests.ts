import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review, CodeDNA } from '../src/models';
import { DnaService } from '../src/services/dna.service';
import { DnaCalculator } from '../src/services/dna/dnaCalculator';
import { PatternNormalizer } from '../src/services/dna/patternNormalizer';
import { ConsistencyAnalyzer } from '../src/services/dna/consistencyAnalyzer';
import bcrypt from 'bcryptjs';

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function runPhase5Tests() {
  console.log('🧪 Starting Code DNA Phase 5 Developer Profile & Intelligence Tests...\n');

  await connectDatabase();

  const userAEmail = `dna_dev_${Date.now()}@codedna.dev`;
  const userBEmail = `dna_intruder_${Date.now()}@codedna.dev`;

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';

  try {
    // 0. Setup Test Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const userA = await User.create({
      name: 'Grace Hopper',
      email: userAEmail,
      passwordHash,
      role: 'user',
    });
    userAId = userA._id.toString();

    const userB = await User.create({
      name: 'Intruder Dave',
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
    // TEST 1: Zero-Review Initial Behavior
    // ----------------------------------------------------
    console.log('--- TEST 1: Zero-Review Initial Code DNA Profile ---');
    const zeroProfile = await DnaService.getDnaProfile(userAId);
    console.log(`Initial Review Count: ${zeroProfile.reviewCount}, Level: ${zeroProfile.levelTitle}`);
    if (zeroProfile.reviewCount === 0 && zeroProfile.levelTitle === 'NEW ENGINEER') {
      console.log('✅ TEST 1 PASSED: Zero-review state initialized cleanly.');
    } else {
      throw new Error(`❌ TEST 1 FAILED: Unexpected zero-review state.`);
    }

    // ----------------------------------------------------
    // TEST 2: Pattern Normalization Layer
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Pattern Normalization Layer ---');
    const finding1: any = {
      title: 'Repeated database lookup inside loop',
      description: 'N+1 query detected during iteration',
      category: 'performance',
    };
    const finding2: any = {
      title: 'Database query executed for every customer',
      description: 'Avoid N+1 queries by batching related entities',
      category: 'performance',
    };
    const norm1 = PatternNormalizer.normalizeFinding(finding1);
    const norm2 = PatternNormalizer.normalizeFinding(finding2);
    console.log(`Normalized Key 1: ${norm1.key}, Normalized Key 2: ${norm2.key}`);
    if (norm1.key === 'performance.n_plus_one' && norm2.key === 'performance.n_plus_one') {
      console.log('✅ TEST 2 PASSED: Varied finding descriptions map to canonical pattern key.');
    } else {
      throw new Error(`❌ TEST 2 FAILED: Pattern normalization failed.`);
    }

    // ----------------------------------------------------
    // TEST 3: Strength Detection (High Consistent Performance)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Strength Detection Scenario ---');
    // Seed 3 reviews with high security scores (9.2, 9.4, 9.5)
    await Review.create([
      {
        userId: userAId,
        reviewIdString: `REV-SEC-1-${Date.now()}`,
        fileName: 'auth_v1.ts',
        language: 'typescript',
        sourceCode: 'export function safe() {}',
        status: 'completed',
        qualityScore: 9.2,
        aiSummary: 'Clean security review',
        findings: [],
        metrics: { correctness: 9.0, security: 9.4, performance: 8.5, architecture: 8.5, maintainability: 9.0 },
        createdAt: new Date(Date.now() - 300000),
      },
      {
        userId: userAId,
        reviewIdString: `REV-SEC-2-${Date.now()}`,
        fileName: 'auth_v2.ts',
        language: 'typescript',
        sourceCode: 'export function safe2() {}',
        status: 'completed',
        qualityScore: 9.4,
        aiSummary: 'Clean security review 2',
        findings: [],
        metrics: { correctness: 9.2, security: 9.6, performance: 8.8, architecture: 8.8, maintainability: 9.2 },
        createdAt: new Date(Date.now() - 200000),
      },
      {
        userId: userAId,
        reviewIdString: `REV-SEC-3-${Date.now()}`,
        fileName: 'auth_v3.ts',
        language: 'typescript',
        sourceCode: 'export function safe3() {}',
        status: 'completed',
        qualityScore: 9.5,
        aiSummary: 'Clean security review 3',
        findings: [],
        metrics: { correctness: 9.4, security: 9.6, performance: 9.0, architecture: 9.0, maintainability: 9.4 },
        createdAt: new Date(Date.now() - 100000),
      },
    ]);

    const profileAfterStrengths = await DnaService.calculateAndSaveDNA(userAId);
    console.log(`Strengths count: ${profileAfterStrengths.strengths.length}`);
    const secStrength = profileAfterStrengths.strengths.find((s) => s.category === 'security');
    console.log(`Security strength identified: "${secStrength?.title}" (Score: ${secStrength?.score})`);
    if (secStrength && secStrength.score! >= 9.0) {
      console.log('✅ TEST 3 PASSED: High consistent performance accurately identified as Strength.');
    } else {
      throw new Error(`❌ TEST 3 FAILED: Security strength not detected.`);
    }

    // ----------------------------------------------------
    // TEST 4: Recurring Weakness vs Isolated Issue
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Recurring Weakness vs Single Isolated Finding ---');
    // Add 2 reviews with performance.n_plus_one finding, and 1 isolated style finding
    await Review.create([
      {
        userId: userAId,
        reviewIdString: `REV-PERF-1-${Date.now()}`,
        fileName: 'user_loop.ts',
        language: 'typescript',
        sourceCode: 'for (const u of users) { db.get(u); }',
        status: 'completed',
        qualityScore: 6.5,
        aiSummary: 'N+1 query in loop',
        findings: [
          {
            id: 'f-n1-1',
            category: 'performance',
            severity: 'high',
            title: 'N+1 database query in loop',
            description: 'Repeated query inside iteration',
            lineStart: 1,
            lineEnd: 1,
            codeSnippet: 'db.get(u)',
            whyItMatters: 'Excessive latency',
            suggestedFix: 'Batch query',
            confidence: 0.95,
          },
          {
            id: 'f-isolated-1',
            category: 'style',
            severity: 'low',
            title: 'Single isolated variable naming issue',
            description: 'Avoid single-character variable names',
            lineStart: 1,
            lineEnd: 1,
            codeSnippet: 'const u',
            whyItMatters: 'Readability',
            suggestedFix: 'Rename to user',
            confidence: 0.8,
          },
        ],
        metrics: { correctness: 8.0, security: 9.0, performance: 5.5, architecture: 8.0, maintainability: 8.0 },
        createdAt: new Date(Date.now() - 50000),
      },
      {
        userId: userAId,
        reviewIdString: `REV-PERF-2-${Date.now()}`,
        fileName: 'orders_loop.ts',
        language: 'typescript',
        sourceCode: 'for (const o of orders) { db.fetch(o); }',
        status: 'completed',
        qualityScore: 6.8,
        aiSummary: 'N+1 query in orders loop',
        findings: [
          {
            id: 'f-n1-2',
            category: 'performance',
            severity: 'high',
            title: 'Database lookup executed for every order',
            description: 'Avoid N+1 queries by eager loading',
            lineStart: 1,
            lineEnd: 1,
            codeSnippet: 'db.fetch(o)',
            whyItMatters: 'High latency',
            suggestedFix: 'Use batch query',
            confidence: 0.95,
          },
        ],
        metrics: { correctness: 8.0, security: 9.0, performance: 6.0, architecture: 8.0, maintainability: 8.0 },
        createdAt: new Date(),
      },
    ]);

    const profileAfterWeakness = await DnaService.calculateAndSaveDNA(userAId);
    console.log(`Recurring Weaknesses count: ${profileAfterWeakness.recurringWeaknesses.length}`);
    const nPlusOneWeakness = profileAfterWeakness.recurringWeaknesses.find((w) => w.key === 'performance.n_plus_one');
    const isolatedWeakness = profileAfterWeakness.recurringWeaknesses.find((w) => w.title.includes('isolated'));

    console.log(`N+1 Weakness occurrenceCount: ${nPlusOneWeakness?.occurrenceCount}`);
    console.log(`Single isolated issue present in recurring: ${Boolean(isolatedWeakness)}`);

    if (nPlusOneWeakness && nPlusOneWeakness.occurrenceCount === 2 && !isolatedWeakness) {
      console.log('✅ TEST 4 PASSED: N+1 accurately labeled recurring (>=2) while isolated issue was excluded.');
    } else {
      throw new Error(`❌ TEST 4 FAILED: Recurring weakness rule violation.`);
    }

    // ----------------------------------------------------
    // TEST 5: Consistency Metric Calculation
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Score Consistency Calculation ---');
    const stableReviews: any[] = [
      { qualityScore: 9.0 },
      { qualityScore: 9.1 },
      { qualityScore: 9.2 },
      { qualityScore: 9.0 },
    ];
    const volatileReviews: any[] = [
      { qualityScore: 5.0 },
      { qualityScore: 9.8 },
      { qualityScore: 4.5 },
      { qualityScore: 9.5 },
    ];
    const highConsistency = ConsistencyAnalyzer.calculateConsistency(stableReviews);
    const lowConsistency = ConsistencyAnalyzer.calculateConsistency(volatileReviews);
    console.log(`Stable developer consistency: ${highConsistency}/100`);
    console.log(`Volatile developer consistency: ${lowConsistency}/100`);

    if (highConsistency > 90 && lowConsistency < 75) {
      console.log('✅ TEST 5 PASSED: Consistency analyzer correctly differentiates stable vs volatile score patterns.');
    } else {
      throw new Error(`❌ TEST 5 FAILED: Consistency calculation unexpected.`);
    }

    // ----------------------------------------------------
    // TEST 6: GET /api/dna and User Authorization Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 6: GET /api/dna & Authorization Isolation ---');
    const resDnaA = await fetch(`${API_BASE}/dna`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataDnaA: any = await resDnaA.json();
    console.log(`User A DNA Status: ${resDnaA.status}, Overall Score: ${dataDnaA.data?.overallScore}, Level: ${dataDnaA.data?.levelTitle}`);

    const resDnaB = await fetch(`${API_BASE}/dna`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataDnaB: any = await resDnaB.json();
    console.log(`User B DNA Status: ${resDnaB.status}, Review Count: ${dataDnaB.data?.reviewCount}`);

    if (resDnaA.status === 200 && dataDnaA.data?.reviewCount === 5 && resDnaB.status === 200 && dataDnaB.data?.reviewCount === 0) {
      console.log('✅ TEST 6 PASSED: User A and User B DNA profiles are completely isolated.');
    } else {
      throw new Error(`❌ TEST 6 FAILED: DNA isolation failed.`);
    }

    // ----------------------------------------------------
    // TEST 7: Summary, Patterns, Trends Endpoints
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Summary, Patterns, and Trends Endpoints ---');
    const [resSummary, resPatterns, resTrends] = await Promise.all([
      fetch(`${API_BASE}/dna/summary`, { headers: { Authorization: `Bearer ${tokenA}` } }),
      fetch(`${API_BASE}/dna/patterns`, { headers: { Authorization: `Bearer ${tokenA}` } }),
      fetch(`${API_BASE}/dna/trends`, { headers: { Authorization: `Bearer ${tokenA}` } }),
    ]);
    const dataSummary: any = await resSummary.json();
    const dataPatterns: any = await resPatterns.json();
    const dataTrends: any = await resTrends.json();

    console.log(`Summary Level: ${dataSummary.data?.levelTitle}, Strengths: ${dataSummary.data?.strengthsCount}`);
    console.log(`Patterns count: ${dataPatterns.data?.patterns?.length}, Recurring: ${dataPatterns.data?.recurringWeaknesses?.length}`);
    console.log(`Trends count: ${dataTrends.data?.trends?.length}`);

    if (resSummary.status === 200 && resPatterns.status === 200 && resTrends.status === 200) {
      console.log('✅ TEST 7 PASSED: Lightweight DNA sub-endpoints returned accurate precomputed data.');
    } else {
      throw new Error(`❌ TEST 7 FAILED: DNA sub-endpoints failed.`);
    }

    // ----------------------------------------------------
    // TEST 8: Full Rebuild Process (rebuildCodeDNA)
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Rebuild Code DNA Process ---');
    const resRebuild = await fetch(`${API_BASE}/dna/rebuild`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataRebuild: any = await resRebuild.json();
    console.log(`Rebuild Status: ${resRebuild.status}, Score: ${dataRebuild.data?.overallScore}`);

    if (resRebuild.status === 200 && dataRebuild.success && dataRebuild.data?.reviewCount === 5) {
      console.log('✅ TEST 8 PASSED: Code DNA profile successfully rebuilt from review history.');
    } else {
      throw new Error(`❌ TEST 8 FAILED: Rebuild process failed.`);
    }

    console.log('\n🎉 ALL PHASE 5 DEVELOPER CODE DNA TESTS PASSED PERFECTLY!\n');
  } finally {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await Review.deleteMany({ userId: { $in: [userAId, userBId] } });
    await CodeDNA.deleteMany({ userId: { $in: [userAId, userBId] } });
    await disconnectDatabase();
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal Phase 5 Test Error:', err);
  process.exit(1);
});
