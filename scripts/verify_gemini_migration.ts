import { GeminiProvider } from '../src/services/ai/geminiProvider';
import { OpenAIProvider } from '../src/services/ai/openaiProvider';
import { IntelligentFallbackProvider } from '../src/services/ai/intelligentFallbackProvider';
import { AIService } from '../src/services/ai/aiService';
import { env } from '../src/config/env';
import { aiResponseSchema } from '../src/services/ai/prompts/reviewPrompt';
import { aiOptimizationResponseSchema } from '../src/services/ai/prompts/optimizationPrompt';

async function runGeminiMigrationVerification() {
  console.log('\n==================================================');
  console.log('CODEDNA — GEMINI AI PROVIDER MIGRATION VERIFICATION');
  console.log('==================================================\n');

  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      allPassed = false;
    }
  }

  // 1. Architecture & Interface Implementation
  console.log('1. AI Provider Architecture:');
  const gemini = new GeminiProvider();
  assert(gemini.name === 'Google Gemini', 'GeminiProvider name is "Google Gemini"');
  assert(typeof gemini.analyzeCode === 'function', 'GeminiProvider implements analyzeCode()');
  assert(typeof gemini.optimizeCode === 'function', 'GeminiProvider implements optimizeCode()');
  assert(typeof gemini.evaluateDefense === 'function', 'GeminiProvider implements evaluateDefense()');
  assert(typeof gemini.isAvailable === 'function', 'GeminiProvider implements isAvailable()');

  // 2. Default Provider & Config
  console.log('\n2. Configuration & Default Provider:');
  assert(env.AI_PROVIDER === 'gemini', `env.AI_PROVIDER defaults to "gemini" (actual: ${env.AI_PROVIDER})`);
  assert(gemini.getModel() === 'gemini-1.5-flash', `Gemini model defaults to "gemini-1.5-flash" (actual: ${gemini.getModel()})`);
  assert(typeof env.GEMINI_API_KEY === 'string', 'GEMINI_API_KEY is configured in backend environment schema');

  // 3. AIService Active Provider Resolution
  console.log('\n3. AIService Provider Resolution:');
  const activePrimary = AIService.getPrimaryProvider();
  assert(activePrimary instanceof GeminiProvider, 'AIService.getPrimaryProvider() resolves to GeminiProvider by default');
  
  // Verify OpenAIProvider is retained
  const openai = new OpenAIProvider();
  assert(openai.name === 'OpenAI', 'OpenAIProvider is retained and available');

  // Verify IntelligentFallbackProvider
  const fallback = new IntelligentFallbackProvider();
  assert(fallback.isAvailable() === true, 'IntelligentFallbackProvider is always available as safety net');

  // 4. Fallback Isolation (Gemini unavailable -> Fallback, NOT OpenAI)
  console.log('\n4. Fallback Routing (No silent OpenAI fallback):');
  // Without live API key, analyzeCode routes to fallback provider, not OpenAI
  const reviewResult = await AIService.analyze({
    language: 'python',
    fileName: 'test.py',
    sourceCode: 'def process(x):\n    return x * 2\n',
    staticFindings: [],
  });
  assert(reviewResult.modelUsed === 'codedna-heuristic-v1', `Fallback model used when live key not present: ${reviewResult.modelUsed}`);
  assert(reviewResult.summary.length > 10, 'Fallback generates clean, valid review summary');
  assert(typeof reviewResult.metrics.correctness === 'number', 'Fallback generates deterministic metrics');

  // 5. Schema Validation & Structured JSON Defense
  console.log('\n5. Structured Output Schema Validation:');
  const validJson = {
    summary: 'Comprehensive analysis of Python module.',
    findings: [
      {
        category: 'security',
        severity: 'high',
        title: 'SQL Injection Risk',
        description: 'String formatting inside raw SQL query execution.',
        lineStart: 5,
        lineEnd: 5,
        codeSnippet: 'cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")',
        whyItMatters: 'Allows untrusted callers to manipulate database queries.',
        suggestedFix: 'cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))',
        confidence: 0.95,
      },
    ],
    metrics: {
      correctness: 8,
      security: 4,
      performance: 9,
      architecture: 8,
      maintainability: 8,
    },
  };
  const parsedValid = aiResponseSchema.safeParse(validJson);
  assert(parsedValid.success === true, 'aiResponseSchema accepts strictly valid review JSON');

  const malformedJson = {
    summary: 'Bad summary',
    findings: [{ category: 'invalid_category', severity: 'extreme' }],
  };
  const parsedInvalid = aiResponseSchema.safeParse(malformedJson);
  assert(parsedInvalid.success === false, 'aiResponseSchema strictly rejects malformed/invalid category/severity');

  // 6. Optimization Response Schema
  console.log('\n6. Optimization Schema Validation:');
  const validOptJson = {
    optimizedCode: 'def process(x: int) -> int:\n    return x * 2\n',
    summary: 'Added static type annotations for robust compilation.',
    changes: [
      {
        category: 'MAINTAINABILITY',
        explanation: 'Enforced explicit typing.',
      },
    ],
  };
  const parsedOptValid = aiOptimizationResponseSchema.safeParse(validOptJson);
  assert(parsedOptValid.success === true, 'aiOptimizationResponseSchema accepts valid optimization output');

  const invalidOptJson = {
    optimizedCode: '',
    summary: '',
    changes: [],
  };
  const parsedOptInvalid = aiOptimizationResponseSchema.safeParse(invalidOptJson);
  assert(parsedOptInvalid.success === false, 'aiOptimizationResponseSchema rejects empty code/changes');

  // 7. Error Handling on Missing / Invalid Key
  console.log('\n7. Error Handling on Unconfigured Live Gemini:');
  let thrownError = false;
  try {
    // Calling gemini directly without valid key throws controlled error
    await gemini.analyzeCode({
      language: 'typescript',
      fileName: 'main.ts',
      sourceCode: 'const a = 1;',
    });
  } catch (err: any) {
    thrownError = true;
    assert(err.message.includes('Gemini API key is not configured'), `Throws controlled error: "${err.message}"`);
  }
  assert(thrownError, 'GeminiProvider refuses execution without valid API key');

  // 8. Battle Optimization Error Handling (No fake fallback code)
  console.log('\n8. Battle Optimization Safety (No Fake Code):');
  let battleOptFailed = false;
  try {
    await AIService.optimize({
      language: 'typescript',
      fileName: 'test.ts',
      originalCode: 'function add(a, b) { return a + b; }',
    });
  } catch (err: any) {
    battleOptFailed = true;
    assert(err.message === 'AI optimization unavailable.', `Refuses to fabricate fake code: "${err.message}"`);
  }
  assert(battleOptFailed, 'AIService.optimize() throws error instead of producing fake/canned code');

  console.log('\n==================================================');
  if (allPassed) {
    console.log('🏆 ALL GEMINI PROVIDER MIGRATION CHECKS PASSED!');
  } else {
    console.log('💥 SOME CHECKS FAILED!');
    process.exit(1);
  }
  console.log('==================================================\n');
}

runGeminiMigrationVerification().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
