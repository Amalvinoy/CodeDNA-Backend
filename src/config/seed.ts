import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Review,
  HistoricalRule,
  CodeDNA,
  RiskPrediction,
  CodeBattle,
  Achievement,
} from '../models';
import { HistoricalIngestionService } from '../services/historical';

export const seedInitialDatabaseData = async () => {
  try {
    // 1. Seed User
    let user = await User.findOne({ email: 'engineer@codedna.dev' });
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 10);
      user = await User.create({
        email: 'engineer@codedna.dev',
        name: 'Amal',
        passwordHash,
        role: 'user',
      });
      console.log('🌱 Seeded default user.');
    }

    const defaultUserId = user._id.toString();


    // 2. Seed CodeDNA
    const existingDna = await CodeDNA.findOne({ userId: defaultUserId });
    if (!existingDna) {
      await CodeDNA.create({
        userId: defaultUserId,
        overallScore: 84,
        maxScore: 100,
        improvementMonthPercent: 18,
        level: 7,
        levelTitle: 'CODE ARCHITECT',
        progressToNextLevel: 78,
        attributes: {
          security: 91,
          correctness: 88,
          maintainability: 82,
          architecture: 68,
          performance: 73,
        },
        metrics: {
          codeComplexity: 68,
          testCoverage: 85,
          modularity: 92,
          recurringBugFrequency: 12,
          codeEfficiency: 94,
        },
        strengths: [
          {
            id: 'str-1',
            title: 'Strong Security',
            percentile: '98th Pctl',
            description:
              'Zero critical OWASP vulnerabilities introduced in last 40 commits. Robust input validation patterns detected.',
            color: 'green',
          },
          {
            id: 'str-2',
            title: 'Architectural Cohesion',
            percentile: '92nd Pctl',
            description:
              'Consistent separation of concerns. High adherence to clean architecture principles across modules.',
            color: 'blue',
          },
        ],
        areasForOptimization: [
          {
            id: 'opt-1',
            title: 'Database Performance',
            priority: 'High Priority',
            description:
              'N+1 query patterns detected in UserService.ts. Redundant data fetching increasing latency overhead by ~12%.',
          },
        ],
        evolutionTrajectory: [
          { month: 'Mar', score: 62 },
          { month: 'Apr', score: 68 },
          { month: 'May', score: 71 },
          { month: 'Jun', score: 76 },
          { month: 'Jul', score: 79 },
          { month: 'Aug', score: 84 },
        ],
        patternHistory: [
          { category: 'SQL Injections', pastFrequency: 14, currentFrequency: 1 },
          { category: 'N+1 Queries', pastFrequency: 22, currentFrequency: 12 },
          { category: 'Unsafe Type Casts', pastFrequency: 18, currentFrequency: 4 },
          { category: 'Large Functions', pastFrequency: 16, currentFrequency: 8 },
        ],
      });
      console.log('🌱 Seeded default CodeDNA profile.');
    }

    // 3. Seed Reviews (Conforming strictly to current Mongoose Review schema)
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.create([
        {
          userId: defaultUserId,
          reviewIdString: 'REV-8924A',
          fileName: 'auth.service.ts',
          language: 'typescript',
          sourceCode: `async function loginUser(req: any, res: any) {
  const { username, password } = req.body;
  // Insecure direct query
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  try {
    const result = await db.raw(query);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}`,
          status: 'completed',
          qualityScore: 7.8,
          scoreDelta: 0.9,
          aiSummary:
            'The implementation introduces a major security flaw in the user login query structure. While performance is optimized, the current string interpolation method exposes the database to injection attacks. Immediate remediation required.',
          issuesCount: 3,
          criticalCount: 1,
          warningCount: 1,
          findings: [
            {
              id: 'iss-1',
              category: 'security',
              severity: 'critical',
              title: 'SQL Injection Vulnerability',
              description:
                'Direct interpolation of unsanitized input into SQL query string.',
              lineStart: 24,
              lineEnd: 24,
              codeSnippet:
                "const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;",
              whyItMatters:
                'Unsanitized user input is being directly interpolated into a raw SQL query string. This allows malicious actors to manipulate the query logic, potentially extracting unauthorized data or bypassing authentication.',
              suggestedFix:
                'Refactor the raw query to use parameterized queries (prepared statements) provided by the ORM, separating the SQL logic from the user-supplied data variables.',
              confidence: 0.95,
              historicalMatchPercent: 94,
              codeContextSnippet: {
                startLine: 21,
                lines: [
                  { lineNumber: 21, code: 'async function loginUser(req, res) {' },
                  { lineNumber: 22, code: '  const { username, password } = req.body;' },
                  { lineNumber: 23, code: '  // Insecure direct query' },
                  {
                    lineNumber: 24,
                    code: "  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;",
                    isHighlighted: true,
                  },
                  { lineNumber: 25, code: '  try {' },
                  { lineNumber: 26, code: '    const result = await db.raw(query);' },
                  { lineNumber: 27, code: '    return res.json(result);' },
                  { lineNumber: 28, code: '  } catch (err) {' },
                  { lineNumber: 29, code: '    return res.status(500).json({ error: err.message });' },
                  { lineNumber: 30, code: '  }' },
                  { lineNumber: 31, code: '}' },
                ],
              },
            },
            {
              id: 'iss-2',
              category: 'performance',
              severity: 'medium',
              title: 'N+1 Query Pattern',
              description:
                'Fetching associated roles inside a loop causes multiple round-trips to the database.',
              lineStart: 87,
              lineEnd: 87,
              codeSnippet:
                'for (const user of users) { user.roles = await db.roles.find({ userId: user.id }); }',
              whyItMatters:
                'Fetching associated roles inside a loop causes multiple round-trips to the database, resulting in exponential latency under load.',
              suggestedFix:
                'Eager load the relations in a single join query or batch with WHERE IN / populate.',
              confidence: 0.88,
              historicalMatchPercent: 88,
              codeContextSnippet: {
                startLine: 84,
                lines: [
                  { lineNumber: 84, code: 'export async function getActiveUsers() {' },
                  { lineNumber: 85, code: '  const users = await db.users.find({ active: true });' },
                  { lineNumber: 86, code: '  // N+1 hazard' },
                  {
                    lineNumber: 87,
                    code: '  for (const user of users) { user.roles = await db.roles.find({ userId: user.id }); }',
                    isHighlighted: true,
                  },
                  { lineNumber: 88, code: '  return users;' },
                  { lineNumber: 89, code: '}' },
                ],
              },
            },
            {
              id: 'iss-3',
              category: 'style',
              severity: 'low',
              title: 'Inconsistent Naming',
              description:
                'Non-standard camelCase identifier found where PascalCase interface convention is established.',
              lineStart: 12,
              lineEnd: 12,
              codeSnippet: 'export interface user_payload { id: string; }',
              whyItMatters:
                'Non-standard camelCase identifier found where PascalCase interface convention is established across the repository.',
              suggestedFix: 'Rename `user_payload` to `UserPayload`.',
              confidence: 0.76,
              historicalMatchPercent: 76,
              codeContextSnippet: {
                startLine: 10,
                lines: [
                  { lineNumber: 10, code: '// Type definition' },
                  { lineNumber: 11, code: 'export interface AuthHeader { token: string; }' },
                  { lineNumber: 12, code: 'export interface user_payload { id: string; }', isHighlighted: true },
                  { lineNumber: 13, code: 'export type SessionId = string;' },
                ],
              },
            },
          ],
        },
        {
          userId: defaultUserId,
          reviewIdString: 'REV-7821B',
          fileName: 'data_pipeline.py',
          language: 'python',
          sourceCode: `def process_records(records):
    """Clean data pipeline transformer."""
    return [r.strip().upper() for r in records if r]`,
          status: 'completed',
          qualityScore: 9.6,
          scoreDelta: 0.4,
          aiSummary:
            'Data transformation pipeline is well structured and follows Pythonic conventions. No critical risks found.',
          issuesCount: 0,
          criticalCount: 0,
          warningCount: 0,
          findings: [],
        },
        {
          userId: defaultUserId,
          reviewIdString: 'REV-6549C',
          fileName: 'worker_pool.go',
          language: 'go',
          sourceCode: `package pool

import "sync"

type Pool struct {
    mu sync.Mutex
    ch chan int
}`,
          status: 'completed',
          qualityScore: 8.8,
          scoreDelta: -0.2,
          aiSummary:
            'Worker pool implementation has proper mutex locking, but channel close could panic if cancelled concurrently.',
          issuesCount: 1,
          criticalCount: 0,
          warningCount: 1,
          findings: [],
        },
      ]);
      console.log('🌱 Seeded default Reviews.');
    }

    // 4. Seed Historical Rules from CSV Ingestion Pipeline
    const rulesCount = await HistoricalRule.countDocuments();
    if (rulesCount === 0) {
      const csvPath = path.resolve(__dirname, '../../data/historical_rules.csv');
      if (fs.existsSync(csvPath)) {
        const report = await HistoricalIngestionService.importFromCSVFile(csvPath);
        console.log(`🌱 Seeded ${report.inserted} Historical Rules from CSV pipeline (${report.durationMs}ms).`);
      } else {
        console.warn(`⚠️ Historical rules CSV not found at ${csvPath}`);
      }
    }

    // 5. Seed RiskPrediction
    const existingRisk = await RiskPrediction.findOne({ userId: defaultUserId });
    if (!existingRisk) {
      await RiskPrediction.create({
        userId: defaultUserId,
        repository: 'CORE-ENGINE',
        prNumber: 'PR #4092',
        lastScanned: 'Just now',
        overallCategory: 'Performance Risk',
        riskPercent: 82,
        riskLevel: 'HIGH',
        recommendation:
          'Immediate intervention recommended before merge to prevent regression.',
        confidencePercent: 94,
        primaryFactors: [
          {
            id: 'f-1',
            label: 'Historical pattern matches known memory leak',
            impactPercent: 32,
            color: 'red',
          },
          {
            id: 'f-2',
            label: 'Current architectural structure (cyclic dependency)',
            impactPercent: 27,
            color: 'amber',
          },
          {
            id: 'f-3',
            label: "High cyclomatic complexity in 'DataParser.js'",
            impactPercent: 15,
            color: 'cyan',
          },
        ],
        diagnosticReasoning: {
          summary:
            'The prediction engine has identified a structural pattern in the proposed changes to the EventHandler class that strongly correlates with runtime performance degradation.',
          affectedClass: 'EventHandler',
          historicalEvidence: {
            occurrences: 4,
            sampleReviews: 10,
            productionAlerts: 3,
            timeframe: '48 hours',
          },
          incidentTimeline: [
            {
              id: 'inc-1',
              pr: 'PR #3910',
              title: 'Refactor Data Sync',
              timeAgo: '2 weeks ago',
              description: 'Pattern introduced. Caused 15% CPU spike in staging.',
              severity: 'red',
            },
            {
              id: 'inc-2',
              pr: 'PR #3882',
              title: 'Async Handlers',
              timeAgo: '1 month ago',
              description: 'Similar cyclic dependency observed. Triggered memory leak alert.',
              severity: 'red',
            },
            {
              id: 'inc-3',
              pr: 'PR #3750',
              title: 'Buffer Update',
              timeAgo: '2 months ago',
              description: 'Partial pattern match. Resolved before merge.',
              severity: 'amber',
            },
          ],
          targetFile: 'src/engine/EventHandler.ts',
          targetLines: 'Lines 142-156',
        },
      });
      console.log('🌱 Seeded default RiskPrediction.');
    }

    // 6. Seed CodeBattle
    const existingBattle = await CodeBattle.findOne({ userId: defaultUserId });
    if (!existingBattle) {
      await CodeBattle.create({
        userId: defaultUserId,
        file: 'src/utils/dataProcessor.ts',
        originalCode: `export function processData(items: any[]) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    if (item.isActive === true) {
      let processed = { ...item };
      processed.value = processed.value * 2;
      // Add to result if valid
      if (processed.value > 10) {
        result.push(processed);
      }
    }
  }
  return result;
}`,
        optimizedCode: `interface DataItem { isActive: boolean; value: number; }

export const processData = (items: DataItem[]): DataItem[] => {
  return items.reduce((acc, item) => {
    if (item.isActive) {
      const newValue = item.value * 2;
      if (newValue > 10) acc.push({ ...item, value: newValue });
    }
    return acc;
  }, [] as DataItem[]);
};`,
        originalScore: 6.8,
        optimizedScore: 9.2,
        complexityOriginal: 'O(n) with redundant allocations',
        complexityOptimized: 'O(n) complexity',
        metrics: {
          security: { original: 91, optimized: 95 },
          performance: { original: 62, optimized: 91 },
          maintainability: { original: 58, optimized: 89 },
        },
        winnerExplanation:
          'AI Optimized eliminates in-loop shallow object cloning, uses strict typing with DataItem, and leverages stream reduction for 3.2x faster execution in benchmark tests.',
      });
      console.log('🌱 Seeded default CodeBattle.');
    }

    // 7. Seed Real Achievements based on actual review data
    const existingAchievement = await Achievement.findOne({ userId: defaultUserId });
    if (!existingAchievement) {
      const { AchievementService } = await import('../services/achievement.service');
      await AchievementService.recalculateUserAchievements(defaultUserId);
      console.log('🌱 Seeded real Achievements based on actual review data.');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};
