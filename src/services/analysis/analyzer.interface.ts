import { ICodeFinding, IReviewMetrics } from '../../models';

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'go'
  | 'rust'
  | 'php'
  | 'sql';

export interface StaticAnalysisResult {
  findings: ICodeFinding[];
  metrics: Partial<IReviewMetrics>;
  staticRulesApplied: number;
}

export interface ILanguageAnalyzer {
  readonly language: SupportedLanguage;
  analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
