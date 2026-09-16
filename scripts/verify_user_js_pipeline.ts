import { ReviewService } from '../src/services/review.service';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/User';

async function verifyPipeline() {
  console.log('====================================================');
  console.log('CODEDNA — VERIFYING USER JAVASCRIPT PIPELINE');
  console.log('====================================================\n');

  await connectDatabase();

  // Create temporary user or find one
  const email = `pipeline_test_${Date.now()}@codedna.dev`;
  const user = await User.create({
    name: 'Pipeline Tester',
    email,
    passwordHash: 'dummyHashForTestingOnly12345!',
  });

  const testCode = `const express = require("express");
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

  console.log('Submitting code to ReviewService.submitReview()...\n');
  const review = await ReviewService.submitReview(user._id.toString(), {
    sourceCode: testCode,
    language: 'javascript',
    fileName: 'app.js',
  });

  console.log('--- REVIEW CREATED SUCCESSFULLY ---');
  console.log(`Review ID: ${review._id}`);
  console.log(`Quality Score: ${review.qualityScore} / 10.0`);
  console.log(`Total Findings: ${review.findings.length}`);
  console.log('\nFindings Breakdown:');
  review.findings.forEach((f: any, idx: number) => {
    console.log(
      `  [${idx + 1}] Line ${f.lineStart}: [${f.category.toUpperCase()}] [${f.severity.toUpperCase()}] ${f.title}`
    );
    console.log(`      Why it matters: ${f.whyItMatters}`);
    console.log(`      Suggested fix: ${f.suggestedFix}`);
  });

  console.log('\nReview Metrics:');
  console.log(JSON.stringify(review.metrics, null, 2));

  // Clean up
  await ReviewService.deleteReview(review._id.toString(), user._id.toString());
  await User.findByIdAndDelete(user._id);
  await disconnectDatabase();
  console.log('\nVerification completed cleanly.');
}

verifyPipeline().catch(err => {
  console.error('Pipeline verification failed:', err);
  process.exit(1);
});
