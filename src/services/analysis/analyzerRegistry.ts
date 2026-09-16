import { ILanguageAnalyzer, SupportedLanguage, StaticAnalysisResult } from './analyzer.interface';
import { JavaScriptAnalyzer } from './javascriptAnalyzer';
import { TypeScriptAnalyzer } from './typescriptAnalyzer';
import { PythonAnalyzer } from './pythonAnalyzer';
import { JavaAnalyzer } from './javaAnalyzer';
import { CppAnalyzer } from './cppAnalyzer';
import { CAnalyzer } from './cAnalyzer';
import { GoAnalyzer } from './goAnalyzer';
import { RustAnalyzer } from './rustAnalyzer';
import { PhpAnalyzer } from './phpAnalyzer';
import { SqlAnalyzer } from './sqlAnalyzer';

export class AnalyzerRegistry {
  private static analyzers: Map<SupportedLanguage, ILanguageAnalyzer> = new Map<SupportedLanguage, ILanguageAnalyzer>([
    ['javascript', new JavaScriptAnalyzer()],
    ['typescript', new TypeScriptAnalyzer()],
    ['python', new PythonAnalyzer()],
    ['java', new JavaAnalyzer()],
    ['cpp', new CppAnalyzer()],
    ['c', new CAnalyzer()],
    ['go', new GoAnalyzer()],
    ['rust', new RustAnalyzer()],
    ['php', new PhpAnalyzer()],
    ['sql', new SqlAnalyzer()],
  ]);

  static getAnalyzer(language: SupportedLanguage): ILanguageAnalyzer | undefined {
    return this.analyzers.get(language);
  }

  static async analyze(
    language: SupportedLanguage,
    sourceCode: string,
    fileName?: string
  ): Promise<StaticAnalysisResult> {
    const analyzer = this.getAnalyzer(language);
    if (analyzer) {
      return await analyzer.analyze(sourceCode, fileName);
    }

    // Default fallback
    return {
      findings: [],
      metrics: {
        correctness: 8.5,
        security: 8.5,
        performance: 8.5,
        architecture: 8.5,
        maintainability: 8.5,
      },
      staticRulesApplied: 0,
    };
  }
}
