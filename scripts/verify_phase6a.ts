import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review, Achievement } from '../src/models';
import { Server } from 'http';

const BASE_URL = 'http://localhost:5001/api';

async function runPhase6aVerification() {
  console.log('====================================================');
  console.log('CODEDNA — PHASE 6A REAL ACHIEVEMENT ENGINE TESTS');
  console.log('====================================================\n');

  await connectDatabase();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(5001, () => resolve(s));
  });

  const timestamp = Date.now();
  const userEmail = `achieve_tester_${timestamp}@codedna.dev`;
  const password = 'Password123!';

  let token = '';
  let userId = '';

  const results: Record<string, 'PASS' | 'FAIL' | 'NONE' | 'FOUND'> = {
    XP: 'FAIL',
    Level: 'FAIL',
    Streak: 'FAIL',
    Badges: 'FAIL',
    Persistence: 'FAIL',
    'Fake values': 'FOUND',
  };

  try {
    // ----------------------------------------------------
    // 1. Register New User
    // ----------------------------------------------------
    console.log('1. Registering new developer...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Achievement Candidate', email: userEmail, password }),
    });
    const regData: any = await regRes.json();
    token = regData.data.token;
    userId = regData.data.user.id;

    // ----------------------------------------------------
    // 2. Confirm Starting State (0 XP, 0 Streak, 0 Badges, Level 1)
    // ----------------------------------------------------
    console.log('\n2. Confirming new user baseline achievement state...');
    const initialRes = await fetch(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initialData: any = await initialRes.json();
    const init = initialData.data;

    console.log('Initial achievements:', {
      currentXp: init.currentXp,
      level: init.level,
      levelTitle: init.levelTitle,
      streak: init.improvementStreak,
      unlockedBadges: init.badges?.filter((b: any) => b.isUnlocked).length,
    });

    const isCleanZeroState =
      init.currentXp === 0 &&
      init.level === 1 &&
      init.improvementStreak === 0 &&
      init.badges?.every((b: any) => !b.isUnlocked);

    const hasNoFakeSeededData =
      init.currentXp !== 14500 &&
      init.level !== 7 &&
      init.improvementStreak !== 18;

    if (isCleanZeroState && hasNoFakeSeededData) {
      console.log('✔ Confirmed: New user has 0 XP, 0 streak, 0 unlocked badges, and Level 1.');
      results['Fake values'] = 'NONE';
    } else {
      console.error('❌ Fake seeded values detected in user achievements!');
    }

    // ----------------------------------------------------
    // 3. Submit First Review (Vulnerable Code -> Standard +100 XP)
    // ----------------------------------------------------
    console.log('\n3. Submitting Review 1 (standard review with vulnerability)...');
    const rev1Res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        language: 'python',
        fileName: 'database.py',
        sourceCode: 'def query_user(cursor, uid):\n    cursor.execute(f"SELECT * FROM users WHERE id = {uid}")\n',
      }),
    });
    const rev1Data: any = await rev1Res.json();
    console.log(`Review 1 submitted: ${rev1Data.data.reviewIdString} (Score: ${rev1Data.data.qualityScore})`);

    // Check updated achievements after Review 1
    const postRev1Res = await fetch(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postRev1Data: any = await postRev1Res.json();
    const ach1 = postRev1Data.data;

    console.log('Achievements after Review 1:', {
      currentXp: ach1.currentXp,
      level: ach1.level,
      streak: ach1.improvementStreak,
      firstReviewBadge: ach1.badges?.find((b: any) => b.id === 'b-first-review')?.isUnlocked,
    });

    const xpGainedRev1 = ach1.currentXp === 100;
    const streakRev1 = ach1.improvementStreak === 1;
    const firstBadgeUnlocked = ach1.badges?.find((b: any) => b.id === 'b-first-review')?.isUnlocked === true;

    if (xpGainedRev1) {
      console.log('✔ XP increased by +100 on completed review.');
    }
    if (streakRev1) {
      console.log('✔ Streak calculated accurately as 1 day.');
      results['Streak'] = 'PASS';
    }
    if (firstBadgeUnlocked) {
      console.log('✔ "First Review" badge unlocked on genuine first review.');
    }

    // ----------------------------------------------------
    // 4. Persistence Test (Simulate Page Refresh)
    // ----------------------------------------------------
    console.log('\n4. Verifying persistence across page refresh...');
    const refreshRes = await fetch(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const refreshData: any = await refreshRes.json();
    const refreshed = refreshData.data;

    if (
      refreshed.currentXp === 100 &&
      refreshed.improvementStreak === 1 &&
      refreshed.badges?.find((b: any) => b.id === 'b-first-review')?.isUnlocked === true
    ) {
      console.log('✔ Achievements verified from MongoDB persistence layer.');
      results['Persistence'] = 'PASS';
    }

    // ----------------------------------------------------
    // 5. Submit Second Review (Clean Code -> +150 XP bonus)
    // ----------------------------------------------------
    console.log('\n5. Submitting Review 2 (clean code with 0 issues -> +150 XP clean bonus)...');
    const rev2Res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        language: 'typescript',
        fileName: 'math_helper.ts',
        sourceCode: 'export function multiplyNumbers(x: number, y: number): number {\n  return x * y;\n}\n',
      }),
    });
    const rev2Data: any = await rev2Res.json();
    console.log(`Review 2 submitted: ${rev2Data.data.reviewIdString} (Score: ${rev2Data.data.qualityScore})`);

    // Check updated achievements after Review 2
    const postRev2Res = await fetch(`${BASE_URL}/achievements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postRev2Data: any = await postRev2Res.json();
    const ach2 = postRev2Data.data;

    console.log('Achievements after Review 2:', {
      currentXp: ach2.currentXp,
      level: ach2.level,
      levelTitle: ach2.levelTitle,
      streak: ach2.improvementStreak,
      unlockedBadges: ach2.badges?.filter((b: any) => b.isUnlocked).map((b: any) => b.title),
    });

    // XP: 100 + 150 = 250 XP
    if (ach2.currentXp === 250) {
      console.log('✔ Clean review awarded +150 XP bonus (total: 250 XP).');
      results['XP'] = 'PASS';
    }

    // Level: 250 XP crosses threshold into Level 2 (Software Engineer)
    if (ach2.level === 2 && ach2.levelTitle === 'Software Engineer') {
      console.log('✔ Level deterministically progressed to Level 2 (Software Engineer).');
      results['Level'] = 'PASS';
    }

    // Badges: Security Improvement or Performance Improvement unlocked from 10/10 review
    const secBadge = ach2.badges?.find((b: any) => b.id === 'b-security-improvement')?.isUnlocked;
    const perfBadge = ach2.badges?.find((b: any) => b.id === 'b-performance-improvement')?.isUnlocked;
    if (secBadge || perfBadge) {
      console.log('✔ High-scoring clean review successfully unlocked metric improvement badges.');
      results['Badges'] = 'PASS';
    }

  } finally {
    console.log('\nCleaning up test artifacts...');
    if (userId) {
      await User.findByIdAndDelete(userId);
      await Review.deleteMany({ userId });
      await Achievement.deleteMany({ userId });
    }
    server.close();
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log('PHASE 6A VERIFICATION SUMMARY:');
  console.log('====================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key}: ${val}`);
  }
}

runPhase6aVerification().catch((err) => {
  console.error('Phase 6A verification failed:', err);
  process.exit(1);
});
