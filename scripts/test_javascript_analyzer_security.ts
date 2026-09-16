import { JavaScriptAnalyzer } from '../src/services/analysis/javascriptAnalyzer';
import { ScoringService } from '../src/services/scoring/scoringService';

async function runTests() {
  console.log('====================================================');
  console.log('CODEDNA — JAVASCRIPT SECURITY ANALYZER TEST SUITE');
  console.log('====================================================\n');

  const analyzer = new JavaScriptAnalyzer();
  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, detail: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${name}`);
    } else {
      console.error(`  [FAIL] ${name}: ${detail}`);
    }
  }

  // ==========================================
  // POSITIVE TEST CASES
  // ==========================================
  console.log('--- 1. POSITIVE SECURITY TEST CASES ---');

  // Case 1: SQL concatenation
  const pos1 = await analyzer.analyze(`
    const id = req.query.id;
    const query = "SELECT * FROM users WHERE id = " + id;
  `);
  const pos1Finding = pos1.findings.find(f => f.title === 'SQL Injection via String Concatenation');
  assert('1. SQL concatenation detected', !!pos1Finding, `Findings: ${pos1.findings.map(f => f.title).join(', ')}`);
  assert('1. SQL concat severity is critical', pos1Finding?.severity === 'critical', `Severity: ${pos1Finding?.severity}`);
  assert('1. SQL concat category is security', pos1Finding?.category === 'security', `Category: ${pos1Finding?.category}`);

  // Case 2: DB query concatenation
  const pos2 = await analyzer.analyze(`
    db.query("SELECT * FROM users WHERE id = " + userId, (err, results) => {});
  `);
  const pos2Finding = pos2.findings.find(f => f.title === 'SQL Injection via String Concatenation');
  assert('2. DB query concatenation detected', !!pos2Finding, `Findings: ${pos2.findings.map(f => f.title).join(', ')}`);

  // Case 3: Hardcoded password
  const pos3 = await analyzer.analyze(`
    const dbConfig = {
      user: "root",
      password: "password123"
    };
  `);
  const pos3Finding = pos3.findings.find(f => f.title === 'Hardcoded Credential Detected');
  assert('3. Hardcoded password detected', !!pos3Finding, `Findings: ${pos3.findings.map(f => f.title).join(', ')}`);
  assert('3. Password severity is high', pos3Finding?.severity === 'high', `Severity: ${pos3Finding?.severity}`);

  // Case 4: Hardcoded API key
  const pos4 = await analyzer.analyze(`
    const apiKey = "sk-live-1234567890abcdef";
  `);
  const pos4Finding = pos4.findings.find(f => f.title === 'Hardcoded Credential Detected');
  assert('4. Hardcoded API key detected', !!pos4Finding, `Findings: ${pos4.findings.map(f => f.title).join(', ')}`);

  // Case 5: Query-param admin authorization
  const pos5 = await analyzer.analyze(`
    const isAdmin = req.query.admin;
    if (isAdmin === "true") {
      res.send("Welcome to admin panel");
    }
  `);
  const pos5Finding = pos5.findings.find(f => f.title === 'Request-Controlled Authorization Decision');
  assert('5. Query-param admin authorization detected', !!pos5Finding, `Findings: ${pos5.findings.map(f => f.title).join(', ')}`);
  assert('5. Auth decision severity is high', pos5Finding?.severity === 'high', `Severity: ${pos5Finding?.severity}`);

  // Case 6: Body role authorization
  const pos6 = await analyzer.analyze(`
    if (req.body.role === "admin") {
      proceedToSuperUser();
    }
  `);
  const pos6Finding = pos6.findings.find(f => f.title === 'Request-Controlled Authorization Decision');
  assert('6. Body role authorization detected', !!pos6Finding, `Findings: ${pos6.findings.map(f => f.title).join(', ')}`);

  // Case 7: error.message exposure
  const pos7 = await analyzer.analyze(`
    res.status(500).json({
      error: err.message
    });
  `);
  const pos7Finding = pos7.findings.find(f => f.title === 'Sensitive Error Exposure in Client Response');
  assert('7. error.message exposure detected', !!pos7Finding, `Findings: ${pos7.findings.map(f => f.title).join(', ')}`);
  assert('7. Error exposure severity is medium', pos7Finding?.severity === 'medium', `Severity: ${pos7Finding?.severity}`);

  // Case 8: error.stack exposure
  const pos8 = await analyzer.analyze(`
    res.send(err.stack);
  `);
  const pos8Finding = pos8.findings.find(f => f.title === 'Sensitive Error Exposure in Client Response');
  assert('8. error.stack exposure detected', !!pos8Finding, `Findings: ${pos8.findings.map(f => f.title).join(', ')}`);

  // Case 9: var declaration
  const pos9 = await analyzer.analyze(`
    var activeUsers = [];
    for (var i = 0; i < 10; i++) {}
  `);
  const pos9Finding = pos9.findings.filter(f => f.title === "Use 'let' or 'const' Instead of 'var'");
  assert('9. var declaration detected', pos9Finding.length >= 1, `Findings count: ${pos9Finding.length}`);
  assert('9. var severity is low', pos9Finding[0]?.severity === 'low', `Severity: ${pos9Finding[0]?.severity}`);
  assert('9. var category is maintainability', pos9Finding[0]?.category === 'maintainability', `Category: ${pos9Finding[0]?.category}`);

  // ==========================================
  // NEGATIVE TEST CASES (AVOID FALSE POSITIVES)
  // ==========================================
  console.log('\n--- 2. NEGATIVE TEST CASES (ZERO FALSE POSITIVES) ---');

  // Neg 1: Parameterized SQL
  const neg1 = await analyzer.analyze(`
    const query = "SELECT * FROM users WHERE id = ?";
    db.query(query, [id]);
  `);
  const neg1Sec = neg1.findings.filter(f => f.category === 'security');
  assert('Neg 1. Parameterized SQL not flagged', neg1Sec.length === 0, `Flagged: ${neg1Sec.map(f => f.title).join(', ')}`);

  // Neg 2: process.env password
  const neg2 = await analyzer.analyze(`
    const password = process.env.DB_PASSWORD;
    const dbConfig = { password: process.env.SECRET_KEY };
  `);
  const neg2Sec = neg2.findings.filter(f => f.title === 'Hardcoded Credential Detected');
  assert('Neg 2. process.env password not flagged', neg2Sec.length === 0, `Flagged: ${neg2Sec.map(f => f.title).join(', ')}`);

  // Neg 3: Authenticated user role check
  const neg3 = await analyzer.analyze(`
    const role = user.role;
    if (role === "admin") {
      renderAdminDashboard();
    }
  `);
  const neg3Sec = neg3.findings.filter(f => f.title === 'Request-Controlled Authorization Decision');
  assert('Neg 3. Authenticated user role check not flagged', neg3Sec.length === 0, `Flagged: ${neg3Sec.map(f => f.title).join(', ')}`);

  // Neg 4: Normal error logging
  const neg4 = await analyzer.analyze(`
    try {
      doSomething();
    } catch (err) {
      console.error(err);
      console.log(err.message);
      return res.status(500).send("An internal server error occurred");
    }
  `);
  const neg4Sec = neg4.findings.filter(f => f.title === 'Sensitive Error Exposure in Client Response');
  assert('Neg 4. Normal error logging not flagged', neg4Sec.length === 0, `Flagged: ${neg4Sec.map(f => f.title).join(', ')}`);

  // Neg 5: Static SQL query
  const neg5 = await analyzer.analyze(`
    const query = "SELECT id, name FROM users";
    const deleteOld = "DELETE FROM sessions";
  `);
  const neg5Sec = neg5.findings.filter(f => f.title === 'SQL Injection via String Concatenation');
  assert('Neg 5. Static SQL query not flagged', neg5Sec.length === 0, `Flagged: ${neg5Sec.map(f => f.title).join(', ')}`);

  // Neg 6: Ordinary string concatenation
  const neg6 = await analyzer.analyze(`
    const greeting = "Hello, " + name;
    const url = "https://api.example.com/" + endpoint;
  `);
  const neg6Sec = neg6.findings.filter(f => f.category === 'security');
  assert('Neg 6. Ordinary string concatenation not flagged', neg6Sec.length === 0, `Flagged: ${neg6Sec.map(f => f.title).join(', ')}`);

  // ==========================================
  // SECTION 6 REAL CODE REVIEW PIPELINE TEST
  // ==========================================
  console.log('\n--- 3. SECTION 6 SAMPLE CODE VERIFICATION ---');
  const userSampleCode = `const express = require("express");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password123",
  database: "company_db"
});

app.get("/users", (req, res) => {
  const id = req.query.id;

  const query = "SELECT * FROM users WHERE id = " + id;

  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Database error");
    }

    res.json(results);
  });
});

app.get("/admin", (req, res) => {
  const isAdmin = req.query.admin;

  if (isAdmin === "true") {
    res.send("Welcome to admin panel");
  } else {
    res.status(403).send("Access denied");
  }
});

function processUsers(users) {
  var activeUsers = [];

  for (var i = 0; i < users.length; i++) {
    if (users[i].active == true) {
      activeUsers.push(users[i]);
    }
  }

  return activeUsers;
}`;

  const sampleResult = await analyzer.analyze(userSampleCode, 'userSample.js');
  console.log(`Total findings generated: ${sampleResult.findings.length}`);
  sampleResult.findings.forEach(f => {
    console.log(`  - [Line ${f.lineStart}] [${f.category.toUpperCase()}] [${f.severity.toUpperCase()}] ${f.title}`);
  });

  const qualityScoreResult = ScoringService.calculateQualityScore(sampleResult.findings, sampleResult.metrics);
  console.log(`\nNatural Quality Score from existing ScoringService:`);
  console.log(`  Score: ${qualityScoreResult.score} / 10.0`);
  console.log(`  Issues Count: ${qualityScoreResult.issuesCount}`);
  console.log(`  Critical: ${qualityScoreResult.criticalCount}`);
  console.log(`  Warnings: ${qualityScoreResult.warningCount}`);
  console.log(`  Metrics Breakdown:`, qualityScoreResult.metrics);

  console.log('\n====================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} tests passed.`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
