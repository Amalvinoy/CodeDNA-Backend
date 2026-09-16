import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models';
import { Server } from 'http';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:5001/api';

async function runPhase6bVerification() {
  console.log('====================================================');
  console.log('CODEDNA — PHASE 6B REAL SETTINGS VERIFICATION');
  console.log('====================================================\n');

  await connectDatabase();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(5001, () => resolve(s));
  });

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@codedna.dev`;
  const userBEmail = `user_b_${timestamp}@codedna.dev`;
  const password = 'Password123!';

  const results: Record<string, 'PASS' | 'FAIL'> = {
    'Profile persistence': 'FAIL',
    'Fake credentials removed': 'FAIL',
    '2FA truthful': 'FAIL',
    'Save API': 'FAIL',
    'User isolation': 'FAIL',
  };

  try {
    // ----------------------------------------------------
    // 1. Register User A
    // ----------------------------------------------------
    console.log('1. Registering User A...');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original Name A', email: userAEmail, password }),
    });
    const regDataA: any = await regResA.json();
    let tokenA = regDataA.data.token;
    const userAId = regDataA.data.user.id;
    console.log('   User A registered with ID:', userAId);

    // ----------------------------------------------------
    // 2. GET /api/settings for User A
    // ----------------------------------------------------
    console.log('\n2. Testing GET /api/settings...');
    const getRes1 = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getData1: any = await getRes1.json();
    console.log('   Initial Settings response:', getData1);
    if (!getData1.success || getData1.data.name !== 'Original Name A') {
      throw new Error(`GET /api/settings returned unexpected data: ${JSON.stringify(getData1)}`);
    }

    // ----------------------------------------------------
    // 3. PATCH /api/settings for User A
    // ----------------------------------------------------
    console.log('\n3. Testing PATCH /api/settings (Update name & preferences)...');
    const updatedName = 'Ada Lovelace';
    const updatedRole = 'Lead Systems Architect';
    const updatedFocus = 'Rust, Distributed Consensus, WebAssembly';
    const patchRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: updatedName,
        primaryRole: updatedRole,
        engineeringFocus: updatedFocus,
        preferences: {
          strictMode: false,
          autoFix: true,
          predictiveAlerts: false,
        },
      }),
    });
    const patchData: any = await patchRes.json();
    console.log('   PATCH response:', patchData);

    if (
      patchRes.status === 200 &&
      patchData.success &&
      patchData.data.name === updatedName &&
      patchData.data.preferences.strictMode === false &&
      patchData.data.preferences.predictiveAlerts === false
    ) {
      results['Save API'] = 'PASS';
      console.log('   ✓ Save API succeeded with confirmed persistence response');
    } else {
      throw new Error(`PATCH /api/settings failed: ${JSON.stringify(patchData)}`);
    }

    // ----------------------------------------------------
    // 4. Page Refresh Simulation (Re-query GET /api/settings)
    // ----------------------------------------------------
    console.log('\n4. Simulating page refresh (GET /api/settings)...');
    const refreshRes = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const refreshData: any = await refreshRes.json();
    console.log('   Refreshed settings:', refreshData.data);

    if (
      refreshData.data.name === updatedName &&
      refreshData.data.primaryRole === updatedRole &&
      refreshData.data.preferences.strictMode === false
    ) {
      console.log('   ✓ Changes persisted after simulated page refresh');
    } else {
      throw new Error('Changes did not persist after refresh');
    }

    // ----------------------------------------------------
    // 5. Logout and Login Simulation
    // ----------------------------------------------------
    console.log('\n5. Testing logout and re-login persistence...');
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password }),
    });
    const loginData: any = await loginRes.json();
    tokenA = loginData.data.token;
    console.log('   Re-login successful. User name from auth:', loginData.data.user.name);

    const postLoginRes = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const postLoginData: any = await postLoginRes.json();
    console.log('   Settings after re-login:', postLoginData.data);

    if (
      postLoginData.data.name === updatedName &&
      postLoginData.data.engineeringFocus === updatedFocus &&
      postLoginData.data.preferences.strictMode === false
    ) {
      results['Profile persistence'] = 'PASS';
      console.log('   ✓ Profile and preferences persist cleanly across full logout/login cycle');
    } else {
      throw new Error('Profile did not persist after re-login');
    }

    // ----------------------------------------------------
    // 6. User Isolation & Server Authority Verification
    // ----------------------------------------------------
    console.log('\n6. Testing User Isolation & Server Authority...');
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Developer', email: userBEmail, password }),
    });
    const regDataB: any = await regResB.json();
    const tokenB = regDataB.data.token;

    // User B gets their own settings
    const getResB = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const getDataB: any = await getResB.json();
    console.log('   User B settings:', getDataB.data);
    if (getDataB.data.name !== 'Bob Developer') {
      throw new Error('User B received incorrect settings data');
    }

    // User B attempts to hijack User A's settings by supplying User A's userId in the payload
    console.log('   User B attempts to supply userId of User A in PATCH payload...');
    const hijackRes = await fetch(`${BASE_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        userId: userAId, // Attempted spoof
        name: 'Malicious Overwrite',
      }),
    });
    const hijackData: any = await hijackRes.json();
    console.log('   Hijack attempt response:', hijackData);

    // Verify User A in DB was NOT modified
    const userADoc = await User.findById(userAId);
    if (!userADoc || userADoc.name !== updatedName) {
      throw new Error(`SECURITY BREACH: User A name was modified to: ${userADoc?.name}`);
    }

    // Verify User B's own name was modified, not User A
    if (hijackData.data.name === 'Malicious Overwrite') {
      console.log('   ✓ Server strictly used req.user.userId authority and updated User B only');
      results['User isolation'] = 'PASS';
    } else {
      throw new Error('User isolation check failed');
    }

    // ----------------------------------------------------
    // 7. Static Code Audit of Frontend Settings Page
    // ----------------------------------------------------
    console.log('\n7. Auditing Frontend Settings Page code...');
    const settingsPagePath = path.resolve(__dirname, '../../frontend/src/app/settings/page.tsx');
    const settingsCode = fs.readFileSync(settingsPagePath, 'utf8');

    const hasFakeOpenAiKey = settingsCode.includes('sk-ant-live-codedna-xxxxxxxx');
    const hasFakeGhToken = settingsCode.includes('ghp_live_access_token_mock_xxxx');
    const hasFake2faEnabled = settingsCode.includes('ENABLED (Authenticator App)');
    const hasFakeSaveTimeout = settingsCode.includes('setTimeout(() => setSaved(false), 2500)') && !settingsCode.includes('SettingsService.updateSettings');

    console.log('   Audit findings:');
    console.log('   - Fake OpenAI key present:', hasFakeOpenAiKey);
    console.log('   - Fake GitHub token present:', hasFakeGhToken);
    console.log('   - Fake 2FA ENABLED present:', hasFake2faEnabled);
    console.log('   - Fake setTimeout save present:', hasFakeSaveTimeout);

    if (!hasFakeOpenAiKey && !hasFakeGhToken) {
      results['Fake credentials removed'] = 'PASS';
      console.log('   ✓ Fake credentials completely removed; replaced with truthful "Not configured" state');
    }

    if (!hasFake2faEnabled && settingsCode.includes('Not configured')) {
      results['2FA truthful'] = 'PASS';
      console.log('   ✓ 2FA does not claim enabled; displays truthful "Not configured"');
    }

  } catch (error: any) {
    console.error('Verification failed with error:', error);
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log('\n====================================================');
  console.log('FINAL REPORT');
  console.log('====================================================');
  console.log(`Profile persistence:\n${results['Profile persistence']}`);
  console.log(`\nFake credentials removed:\n${results['Fake credentials removed']}`);
  console.log(`\n2FA truthful:\n${results['2FA truthful']}`);
  console.log(`\nSave API:\n${results['Save API']}`);
  console.log(`\nUser isolation:\n${results['User isolation']}`);
}

runPhase6bVerification();
