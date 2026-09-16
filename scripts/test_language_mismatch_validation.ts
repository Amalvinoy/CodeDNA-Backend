import { LanguageDetector } from '../src/services/analysis/languageDetector';
import { ReviewService } from '../src/services/review.service';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User, Review, CodeDNA } from '../src/models';

async function runLanguageMismatchTests() {
  console.log('====================================================');
  console.log('CODEDNA — LANGUAGE MISMATCH VALIDATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name: string, condition: boolean, detail: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${name}`);
    } else {
      console.error(`  [FAIL] ${name}: ${detail}`);
    }
  }

  // ==========================================
  // POSITIVE TEST CASES (Valid Lang -> Valid Lang)
  // ==========================================
  console.log('--- 1. POSITIVE CONSISTENCY TESTS ---');

  // 1. Valid JavaScript -> JavaScript
  const posJs = LanguageDetector.validateLanguageWithCode(
    'javascript',
    `const express = require('express');
const app = express();
app.get('/users', (req, res) => {
  res.json({ status: 'ok' });
});`
  );
  assert('1. Valid JavaScript -> JavaScript', posJs.isValid, `Got warning: ${posJs.warning}`);

  // 2. Valid TypeScript -> TypeScript
  const posTs = LanguageDetector.validateLanguageWithCode(
    'typescript',
    `interface UserProfile {
  id: string;
  name: string;
}
export function getUser(id: string): UserProfile {
  return { id, name: 'Alice' };
}`
  );
  assert('2. Valid TypeScript -> TypeScript', posTs.isValid, `Got warning: ${posTs.warning}`);

  // 3. Valid Python -> Python
  const posPy = LanguageDetector.validateLanguageWithCode(
    'python',
    `import os

def calculate_total(items):
    total = 0
    for item in items:
        total += item.price
    return total`
  );
  assert('3. Valid Python -> Python', posPy.isValid, `Got warning: ${posPy.warning}`);

  // 4. Valid Java -> Java
  const posJava = LanguageDetector.validateLanguageWithCode(
    'java',
    `package com.codedna.service;

public class UserService {
    public static void main(String[] args) {
        System.out.println("User service started");
    }
}`
  );
  assert('4. Valid Java -> Java', posJava.isValid, `Got warning: ${posJava.warning}`);

  // 5. Valid C++ -> C++
  const posCpp = LanguageDetector.validateLanguageWithCode(
    'cpp',
    `#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums = {1, 2, 3};
    std::cout << "Count: " << nums.size() << std::endl;
    return 0;
}`
  );
  assert('5. Valid C++ -> C++', posCpp.isValid, `Got warning: ${posCpp.warning}`);

  // 6. Valid C -> C
  const posC = LanguageDetector.validateLanguageWithCode(
    'c',
    `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    printf("Hello from C\\n");
    return 0;
}`
  );
  assert('6. Valid C -> C', posC.isValid, `Got warning: ${posC.warning}`);

  // 7. Valid Go -> Go
  const posGo = LanguageDetector.validateLanguageWithCode(
    'go',
    `package main

import "fmt"

func main() {
    message := "Hello from Go"
    fmt.Println(message)
}`
  );
  assert('7. Valid Go -> Go', posGo.isValid, `Got warning: ${posGo.warning}`);

  // 8. Valid Rust -> Rust
  const posRust = LanguageDetector.validateLanguageWithCode(
    'rust',
    `fn process_values(mut values: Vec<i32>) -> i32 {
    let mut sum = 0;
    for v in values {
        sum += v;
    }
    println!("Sum is {}", sum);
    sum
}`
  );
  assert('8. Valid Rust -> Rust', posRust.isValid, `Got warning: ${posRust.warning}`);

  // 9. Valid PHP -> PHP
  const posPhp = LanguageDetector.validateLanguageWithCode(
    'php',
    `<?php
$username = $_GET['user'];
echo "Welcome, " . $username;
?>`
  );
  assert('9. Valid PHP -> PHP', posPhp.isValid, `Got warning: ${posPhp.warning}`);

  // 10. Valid SQL -> SQL
  const posSql = LanguageDetector.validateLanguageWithCode(
    'sql',
    `SELECT users.id, users.email, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id
WHERE orders.status = 'active';`
  );
  assert('10. Valid SQL -> SQL', posSql.isValid, `Got warning: ${posSql.warning}`);

  // ==========================================
  // MISMATCH TEST CASES
  // ==========================================
  console.log('\n--- 2. MISMATCH TEST CASES ---');

  // 11. JavaScript -> Python
  const misJsPy = LanguageDetector.validateLanguageWithCode(
    'python',
    `const db = mysql.createConnection({
  host: "localhost",
  password: "password123"
});
app.get("/users", (req, res) => {
  const id = req.query.id;
});`
  );
  assert(
    '11. JavaScript -> Python detected as mismatch',
    !misJsPy.isValid && misJsPy.suggestedLanguage === 'javascript',
    `Result: isValid=${misJsPy.isValid}, suggested=${misJsPy.suggestedLanguage}`
  );

  // 12. Python -> JavaScript
  const misPyJs = LanguageDetector.validateLanguageWithCode(
    'javascript',
    `def process_users(users):
    active_users = []
    for user in users:
        if user.is_active:
            active_users.append(user)
    return active_users`
  );
  assert(
    '12. Python -> JavaScript detected as mismatch',
    !misPyJs.isValid && misPyJs.suggestedLanguage === 'python',
    `Result: isValid=${misPyJs.isValid}, suggested=${misPyJs.suggestedLanguage}`
  );

  // 13. SQL -> Python
  const misSqlPy = LanguageDetector.validateLanguageWithCode(
    'python',
    `SELECT id, name, created_at FROM audit_logs WHERE user_id = 42;`
  );
  assert(
    '13. SQL -> Python detected as mismatch',
    !misSqlPy.isValid && misSqlPy.suggestedLanguage === 'sql',
    `Result: isValid=${misSqlPy.isValid}, suggested=${misSqlPy.suggestedLanguage}`
  );

  // 14. Python -> SQL
  const misPySql = LanguageDetector.validateLanguageWithCode(
    'sql',
    `def get_metrics():
    return {"latency": 42}`
  );
  assert(
    '14. Python -> SQL detected as mismatch',
    !misPySql.isValid && misPySql.suggestedLanguage === 'python',
    `Result: isValid=${misPySql.isValid}, suggested=${misPySql.suggestedLanguage}`
  );

  // 15. JavaScript -> Java
  const misJsJava = LanguageDetector.validateLanguageWithCode(
    'java',
    `const express = require('express');
const app = express();
app.listen(3000);`
  );
  assert(
    '15. JavaScript -> Java detected as mismatch',
    !misJsJava.isValid && misJsJava.suggestedLanguage === 'javascript',
    `Result: isValid=${misJsJava.isValid}, suggested=${misJsJava.suggestedLanguage}`
  );

  // 16. Python -> Java
  const misPyJava = LanguageDetector.validateLanguageWithCode(
    'java',
    `def calculate(a, b):
    return a * b + 1`
  );
  assert(
    '16. Python -> Java detected as mismatch',
    !misPyJava.isValid && misPyJava.suggestedLanguage === 'python',
    `Result: isValid=${misPyJava.isValid}, suggested=${misPyJava.suggestedLanguage}`
  );

  // ==========================================
  // EDGE CASES
  // ==========================================
  console.log('\n--- 3. EDGE CASES & FALSE-POSITIVE PREVENTION ---');

  // 17. Python string containing "const"
  const edge17 = LanguageDetector.validateLanguageWithCode(
    'python',
    `msg = "const value = 10"
print(msg)`
  );
  assert('17. Python string containing "const" not rejected', edge17.isValid, `Got warning: ${edge17.warning}`);

  // 18. JavaScript string containing "def"
  const edge18 = LanguageDetector.validateLanguageWithCode(
    'javascript',
    `const template = "def python_func(): pass";
console.log(template);`
  );
  assert('18. JavaScript string containing "def" not rejected', edge18.isValid, `Got warning: ${edge18.warning}`);

  // 19. Comments containing keywords from another language
  const edge19 = LanguageDetector.validateLanguageWithCode(
    'python',
    `# let x = 10; const y = 20; function run() {}
def actual_python_code():
    return 42`
  );
  assert('19. Python with JS comments not rejected', edge19.isValid, `Got warning: ${edge19.warning}`);

  // 20. Short/simple valid snippets
  const edge20Py = LanguageDetector.validateLanguageWithCode(
    'python',
    `x = 10
y = 20
z = x + y`
  );
  assert('20a. Simple Python math snippet valid', edge20Py.isValid, `Got warning: ${edge20Py.warning}`);

  const edge20Js = LanguageDetector.validateLanguageWithCode(
    'javascript',
    `let count = 0;
count += 1;`
  );
  assert('20b. Simple JS snippet valid', edge20Js.isValid, `Got warning: ${edge20Js.warning}`);

  // 21. Empty code (handled by validator)
  assert('21. Language normalization handles empty safely', LanguageDetector.normalizeLanguage('') === null, 'Empty should return null');

  // 22. Unsupported language
  assert(
    '22. Unsupported language rejected',
    LanguageDetector.normalizeLanguage('cobol') === null,
    'Unsupported should return null'
  );

  // ==========================================
  // 4. DIRECT API SECURITY TEST (ReviewService level)
  // ==========================================
  console.log('\n--- 4. DIRECT API SECURITY / TRANSACTION TEST ---');
  await connectDatabase();

  const testUser = await User.create({
    name: 'Mismatch Attacker',
    email: `attacker_${Date.now()}@codedna.dev`,
    passwordHash: 'dummyPass12345!',
  });

  const mismatchJsCode = `const db = mysql.createConnection({
  host: "localhost",
  password: "password123"
});

app.get("/users", (req, res) => {
  const id = req.query.id;
  const query = "SELECT * FROM users WHERE id = " + id;
});`;

  let caughtError: any = null;
  try {
    await ReviewService.submitReview(testUser._id.toString(), {
      language: 'python',
      fileName: 'transformer.py',
      sourceCode: mismatchJsCode,
    });
  } catch (err: any) {
    caughtError = err;
  }

  assert(
    'Security Test: ReviewService threw error on JS submitted as Python',
    caughtError !== null,
    'ReviewService should have thrown an error'
  );
  assert(
    'Security Test: Status code is HTTP 400',
    caughtError?.statusCode === 400,
    `Status code was ${caughtError?.statusCode}`
  );
  assert(
    'Security Test: Error message informs of language mismatch',
    caughtError?.message.includes('Selected: Python') && caughtError?.message.includes('JavaScript'),
    `Message was: "${caughtError?.message}"`
  );

  // Verify database persistence integrity
  const reviewCount = await Review.countDocuments({ userId: testUser._id });
  assert('Security Test: Exactly 0 reviews created in MongoDB', reviewCount === 0, `Count was ${reviewCount}`);

  const dnaProfile = await CodeDNA.findOne({ userId: testUser._id });
  assert('Security Test: Exactly 0 DNA profiles updated/created', dnaProfile === null, 'DNA should remain null');

  // Cleanup
  await User.findByIdAndDelete(testUser._id);
  await disconnectDatabase();

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} / ${total} tests passed.`);
  console.log('====================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runLanguageMismatchTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
