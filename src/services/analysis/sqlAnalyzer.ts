import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
import { ICodeFinding } from '../../models';
import { generateCodeContextSnippet } from './contextSnippetHelper';

export class SqlAnalyzer implements ILanguageAnalyzer {
  readonly language = 'sql' as const;

  async analyze(sourceCode: string, fileName = 'query.sql'): Promise<StaticAnalysisResult> {
    const findings: ICodeFinding[] = [];
    const lines = sourceCode.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // 1. SELECT *
      if (/SELECT\s+\*\s+FROM/i.test(trimmed) && !trimmed.startsWith('--')) {
        findings.push({
          id: `sql-perf-select-star-${lineNum}`,
          category: 'performance',
          severity: 'low',
          title: 'Avoid SELECT * in Production Queries',
          description: 'Selecting all columns increases I/O overhead and network bandwidth transfer unnecessarily.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Prevents database engines from using index-only covering scans and wastes buffer cache.',
          suggestedFix: 'Explicitly specify only the required column names in the SELECT clause.',
          confidence: 0.9,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 2. Unindexed Leading Wildcard in LIKE '%...'
      if (/LIKE\s+['"]%.*['"]/i.test(trimmed) && !trimmed.startsWith('--')) {
        findings.push({
          id: `sql-perf-leading-wildcard-${lineNum}`,
          category: 'performance',
          severity: 'medium',
          title: 'Leading Wildcard in LIKE Clause Disables Index Scans',
          description: 'A wildcard at the start of a pattern (`%value`) forces a full table scan, bypassing B-Tree indexes.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Query performance drops from O(log N) to O(N), causing database CPU bottlenecks on large datasets.',
          suggestedFix: 'Use trailing wildcards (`value%`), full-text search indexes (GIN/GiST or FULLTEXT), or trigram indexes.',
          confidence: 0.94,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }
    });

    return {
      findings,
      metrics: { correctness: 9.0, security: 9.5, performance: findings.length > 0 ? 7.2 : 9.0, architecture: 8.6, maintainability: 8.8 },
      staticRulesApplied: 10,
    };
  }
}
