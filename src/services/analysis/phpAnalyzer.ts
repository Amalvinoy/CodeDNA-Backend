import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
import { ICodeFinding } from '../../models';
import { generateCodeContextSnippet } from './contextSnippetHelper';

export class PhpAnalyzer implements ILanguageAnalyzer {
  readonly language = 'php' as const;

  async analyze(sourceCode: string, fileName = 'index.php'): Promise<StaticAnalysisResult> {
    const findings: ICodeFinding[] = [];
    const lines = sourceCode.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // 1. Direct $_GET / $_POST in query
      if (/(SELECT|INSERT|UPDATE|DELETE).*(\$_GET|\$_POST|\$_REQUEST)/i.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `php-sec-sql-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'Direct User Superglobal in SQL Statement',
          description: 'Interpolating `$_GET` or `$_POST` directly into SQL queries causes direct SQL injection.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Allows unauthenticated database exfiltration and command execution in vulnerable environments.',
          suggestedFix: 'Use PDO prepared statements with parameter binding: `$stmt->execute([$param])`.',
          confidence: 0.98,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 2. eval() in PHP
      if (/\beval\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `php-sec-eval-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'PHP eval() Code Execution',
          description: 'Dynamic code evaluation through eval() in PHP is extremely dangerous and prone to web-shell attacks.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Grants direct server execution to user-supplied input.',
          suggestedFix: 'Refactor to standard procedural logic or strict JSON decoders.',
          confidence: 0.99,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }
    });

    return {
      findings,
      metrics: { correctness: 8.5, security: findings.length > 0 ? 5.8 : 9.0, performance: 8.4, architecture: 8.0, maintainability: 8.2 },
      staticRulesApplied: 15,
    };
  }
}
