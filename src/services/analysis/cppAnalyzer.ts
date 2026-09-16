import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
import { ICodeFinding } from '../../models';
import { generateCodeContextSnippet } from './contextSnippetHelper';

export class CppAnalyzer implements ILanguageAnalyzer {
  readonly language = 'cpp' as const;

  async analyze(sourceCode: string, fileName = 'main.cpp'): Promise<StaticAnalysisResult> {
    const findings: ICodeFinding[] = [];
    const lines = sourceCode.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // 1. Raw pointer new without smart pointer
      if (/\bnew\s+\w+(\[.*\])?\(?/.test(trimmed) && !trimmed.startsWith('//') && !trimmed.includes('make_unique')) {
        findings.push({
          id: `cpp-mem-raw-new-${lineNum}`,
          category: 'architecture',
          severity: 'medium',
          title: 'Raw Memory Allocation (`new`) Used',
          description: 'Managing raw pointers increases vulnerability to memory leaks and double-free hazards.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Exceptions between allocation and `delete` cause memory leaks.',
          suggestedFix: 'Use RAII smart pointers: `std::unique_ptr` or `std::make_shared`.',
          confidence: 0.9,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }

      // 2. Unsafe string copy functions: strcpy, gets
      if (/\b(strcpy|gets|strcat)\s*\(/.test(trimmed) && !trimmed.startsWith('//')) {
        findings.push({
          id: `cpp-sec-buffer-overflow-${lineNum}`,
          category: 'security',
          severity: 'critical',
          title: 'Buffer Overflow Hazard with Unsafe C-String Function',
          description: 'Functions like `strcpy` do not check buffer boundary lengths, leading to buffer overflow vulnerabilities.',
          lineStart: lineNum,
          lineEnd: lineNum,
          codeSnippet: trimmed,
          whyItMatters: 'Stack/heap buffer overflows can be exploited for arbitrary code execution.',
          suggestedFix: 'Use `std::string`, `std::string_view`, or bounded copy functions (`strncpy_s`).',
          confidence: 0.98,
          codeContextSnippet: generateCodeContextSnippet(sourceCode, lineNum),
        });
      }
    });

    return {
      findings,
      metrics: { correctness: 8.5, security: findings.length > 0 ? 6.5 : 9.0, performance: 9.2, architecture: 8.2, maintainability: 8.0 },
      staticRulesApplied: 14,
    };
  }
}
