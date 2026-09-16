import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review, HistoricalRule } from '../src/models';
import { HistoricalIngestionService } from '../src/services/historical/historicalIngestion.service';
import { HistoricalRetriever } from '../src/services/historical/historicalRetriever';
import { EmbeddingService } from '../src/services/embeddings';
import bcrypt from 'bcryptjs';

const API_BASE = process.env.API_BASE || 'http://localhost:5001/api';

async function runPhase4Tests() {
  console.log('🧪 Starting Code DNA Phase 4 Historical Intelligence & RAG Tests...\n');

  await connectDatabase();

  const userAEmail = `historical_eng_${Date.now()}@codedna.dev`;
  const userBEmail = `historical_intruder_${Date.now()}@codedna.dev`;

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
    // TEST 1: CSV Ingestion of Valid Dataset
    // ----------------------------------------------------
    console.log('--- TEST 1: CSV Ingestion of Historical Rules ---');
    const sampleCsv = `id,type,description
101,security,Never interpolate raw user input directly into SQL queries
102,performance,Cache repeated database lookups inside the request loop
103,correctness,Avoid mutable default arguments in Python function definitions
`;
    const report1 = await HistoricalIngestionService.importFromCSVContent(sampleCsv);
    console.log(`Inserted: ${report1.inserted}, Valid: ${report1.validRows}`);
    if (report1.validRows === 3 && (report1.inserted === 3 || report1.updated === 3 || report1.skipped === 3)) {
      console.log('✅ TEST 1 PASSED: CSV dataset imported cleanly.');
    } else {
      throw new Error(`❌ TEST 1 FAILED: ${JSON.stringify(report1)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Malformed Header CSV Rejection
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Malformed CSV Header Validation ---');
    let malformedHeaderError = false;
    try {
      await HistoricalIngestionService.importFromCSVContent('foo,bar,baz\n1,2,3');
    } catch (e: any) {
      malformedHeaderError = e.message.includes('Invalid CSV header');
    }
    if (malformedHeaderError) {
      console.log('✅ TEST 2 PASSED: Malformed CSV header rejected with clear error.');
    } else {
      throw new Error('❌ TEST 2 FAILED: Failed to reject malformed header.');
    }

    // ----------------------------------------------------
    // TEST 3: Missing Description & Missing ID Rows
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Missing Fields Rejection in CSV ---');
    const invalidRowsCsv = `id,type,description
104,security,
,performance,Missing ID rule
105,correctness,Valid rule with full data
`;
    const report3 = await HistoricalIngestionService.importFromCSVContent(invalidRowsCsv);
    console.log(`Invalid Rows detected: ${report3.invalidRows}, Valid Rows: ${report3.validRows}`);
    if (report3.invalidRows === 2 && report3.validRows === 1) {
      console.log('✅ TEST 3 PASSED: Missing fields rejected accurately.');
    } else {
      throw new Error(`❌ TEST 3 FAILED: ${JSON.stringify(report3)}`);
    }

    // ----------------------------------------------------
    // TEST 4: Duplicate Records in CSV Ingestion
    // ----------------------------------------------------
    console.log('\n--- TEST 4: In-Batch Duplicate IDs & Descriptions ---');
    const dupCsv = `id,type,description
106,security,Unique Rule Description A
106,security,Duplicate ID rule
107,security,Unique Rule Description A
`;
    const report4 = await HistoricalIngestionService.importFromCSVContent(dupCsv);
    console.log(`Duplicates caught: ${report4.duplicates}, Valid: ${report4.validRows}`);
    if (report4.duplicates === 2 && report4.validRows === 1) {
      console.log('✅ TEST 4 PASSED: In-batch duplicates caught without data corruption.');
    } else {
      throw new Error(`❌ TEST 4 FAILED: ${JSON.stringify(report4)}`);
    }

    // ----------------------------------------------------
    // TEST 5: Idempotent CSV Import
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Idempotent CSV Import ---');
    const report5 = await HistoricalIngestionService.importFromCSVContent(sampleCsv);
    console.log(`Re-import Result: Inserted: ${report5.inserted}, Updated: ${report5.updated}, Skipped: ${report5.skipped}`);
    const ruleCount = await HistoricalRule.countDocuments({ externalId: { $in: ['101', '102', '103'] } });
    if (ruleCount === 3) {
      console.log('✅ TEST 5 PASSED: Import is completely idempotent (no duplicate documents created).');
    } else {
      throw new Error(`❌ TEST 5 FAILED: Found ${ruleCount} rules, expected 3.`);
    }

    // ----------------------------------------------------
    // TEST 6: Embedding Generation & Cosine Similarity
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Semantic Embedding & Cosine Similarity ---');
    const emb1 = await EmbeddingService.generateEmbedding('sql query database injection vulnerability');
    const emb2 = await EmbeddingService.generateEmbedding('raw user parameter interpolation in sql statement');
    const emb3 = await EmbeddingService.generateEmbedding('unrelated ui css color styling typography');

    const simRelated = EmbeddingService.cosineSimilarity(emb1, emb2);
    const simUnrelated = EmbeddingService.cosineSimilarity(emb1, emb3);
    console.log(`Related SQL texts similarity: ${simRelated}`);
    console.log(`Unrelated UI text similarity: ${simUnrelated}`);
    if (simRelated > 0.6 && simRelated > simUnrelated) {
      console.log('✅ TEST 6 PASSED: Semantic vectors demonstrate high cosine similarity for related concepts.');
    } else {
      throw new Error(`❌ TEST 6 FAILED: Semantic similarity unexpected.`);
    }

    // ----------------------------------------------------
    // TEST 7: Semantic Retrieval of Known Historical Security Rule
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Semantic Retrieval on Code Snippet ---');
    const sqlVulnerableCode = `
def find_customer(cust_id):
    # Raw SQL execution
    query = f"SELECT * FROM customers WHERE id = '{cust_id}'"
    return db.execute(query)
`;
    const retrievalResult = await HistoricalRetriever.retrieveRelevantRules({
      code: sqlVulnerableCode,
      language: 'python',
      limit: 3,
    });
    console.log(`Matches found: ${retrievalResult.matches.length}`);
    const topMatch = retrievalResult.matches[0];
    console.log(`Top match: [${topMatch?.type}] "${topMatch?.description}" (Similarity: ${topMatch?.similarity})`);
    if (retrievalResult.matches.length > 0 && topMatch.description.toLowerCase().includes('sql')) {
      console.log('✅ TEST 7 PASSED: Relevant historical SQL security policy retrieved.');
    } else {
      throw new Error(`❌ TEST 7 FAILED: Expected SQL rule match.`);
    }

    // ----------------------------------------------------
    // TEST 8: Irrelevant Rule / Clean Code No-Match Behavior
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Irrelevant Rule Rejection on Clean Code ---');
    const cleanCode = `
def add_numbers(a: int, b: int) -> int:
    """Calculates sum of two integers."""
    return a + b
`;
    const cleanRetrieval = await HistoricalRetriever.retrieveRelevantRules({
      code: cleanCode,
      language: 'python',
      limit: 3,
      threshold: 0.85,
    });
    console.log(`Matches on clean code: ${cleanRetrieval.matches.length}`);
    if (cleanRetrieval.matches.length === 0) {
      console.log('✅ TEST 8 PASSED: Clean code produced zero spurious historical matches.');
    } else {
      throw new Error(`❌ TEST 8 FAILED: Fabricated match found on clean code.`);
    }

    // ----------------------------------------------------
    // TEST 9: End-to-End Review Pipeline with Historical Attribution
    // ----------------------------------------------------
    console.log('\n--- TEST 9: End-to-End Review Pipeline with Grounded Historical Context ---');
    const resReview = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        language: 'python',
        fileName: 'customer_repo.py',
        sourceCode: sqlVulnerableCode,
      }),
    });
    const reviewData: any = await resReview.json();
    console.log(`Status: ${resReview.status}, ReviewId: ${reviewData.data?.reviewIdString}`);
    console.log(`Historical Context Matched Rules: ${reviewData.data?.historicalContext?.matchedRules?.length}`);
    const findingWithHistorical = reviewData.data?.findings?.find((f: any) => f.historicalMatch);
    console.log(`Finding with historical attribution: "${findingWithHistorical?.title}" (Similarity: ${findingWithHistorical?.historicalSimilarity})`);

    let reviewId = reviewData.data?.reviewIdString;

    if (
      resReview.status === 201 &&
      reviewData.success &&
      reviewData.data?.historicalContext?.matchedRules?.length > 0 &&
      findingWithHistorical
    ) {
      console.log('✅ TEST 9 PASSED: Review generated with real grounded historical attribution.');
    } else {
      throw new Error(`❌ TEST 9 FAILED: Missing historical context in review.`);
    }

    // ----------------------------------------------------
    // TEST 10: Historical Context Retrieval & Authorization Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Review Historical Context Endpoint & User Isolation ---');
    // User A fetches own review historical context
    const resContextA = await fetch(`${API_BASE}/reviews/${reviewId}/historical-context`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataContextA: any = await resContextA.json();
    console.log(`User A historical context status: ${resContextA.status}, Rules count: ${dataContextA.data?.matchedRules?.length}`);

    // User B attempts to access User A's review historical context (Must Fail)
    const resContextB = await fetch(`${API_BASE}/reviews/${reviewId}/historical-context`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log(`User B historical context status: ${resContextB.status}`);

    if (resContextA.status === 200 && dataContextA.data?.matchedRules?.length > 0 && resContextB.status === 404) {
      console.log('✅ TEST 10 PASSED: Historical context strictly protected by user ownership.');
    } else {
      throw new Error(`❌ TEST 10 FAILED: Historical context isolation violation.`);
    }

    // ----------------------------------------------------
    // TEST 11: GET /api/historical-rules Endpoint
    // ----------------------------------------------------
    console.log('\n--- TEST 11: GET /api/historical-rules Query & Search ---');
    const resRules = await fetch(`${API_BASE}/historical-rules?category=security&limit=5`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataRules: any = await resRules.json();
    console.log(`Status: ${resRules.status}, Security rules found: ${dataRules.data?.length}`);
    if (resRules.status === 200 && dataRules.success && dataRules.data?.length > 0) {
      console.log('✅ TEST 11 PASSED: Historical rules API returned active engineering memory.');
    } else {
      throw new Error(`❌ TEST 11 FAILED: Could not query historical rules.`);
    }

    console.log('\n🎉 ALL PHASE 4 HISTORICAL INTELLIGENCE TESTS PASSED PERFECTLY!\n');
  } finally {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await Review.deleteMany({ userId: { $in: [userAId, userBId] } });
    await HistoricalRule.deleteMany({ externalId: { $in: ['101', '102', '103', '104', '105', '106', '107'] } });
    await disconnectDatabase();
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal Historical Intelligence Test Error:', err);
  process.exit(1);
});
