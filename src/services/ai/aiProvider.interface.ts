import { ICodeFinding, IReviewMetrics, IMatchedHistoricalRule } from '../../models';

export interface AIAnalysisRequest {
  language: string;
  fileName: string;
  sourceCode: string;
  staticFindings?: ICodeFinding[];
  historicalRules?: IMatchedHistoricalRule[];
}

export interface AIAnalysisResult {
  summary: string;
  findings: ICodeFinding[];
  metrics: Partial<IReviewMetrics>;
  modelUsed: string;
}

export interface AIOptimizationRequest {
  language: string;
  fileName: string;
  originalCode: string;
  staticFindings?: ICodeFinding[];
  historicalRules?: IMatchedHistoricalRule[];
  dnaWeaknesses?: string[];
}

export interface AIOptimizationResult {
  optimizedCode: string;
  summary: string;
  changes: Array<{
    category: string;
    explanation: string;
  }>;
  modelUsed: string;
}

export interface AIDefenseEvaluationRequest {
  language?: string;
  originalCode?: string;
  optimizedCode?: string;
  defenseReasoning: string;
}

export interface AIDefenseEvaluationResult {
  evaluation: string;
  pointsAwarded: number;
}

export interface IAIProvider {
  readonly name: string;
  isAvailable(): boolean;
  analyzeCode(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
  optimizeCode?(request: AIOptimizationRequest): Promise<AIOptimizationResult>;
  evaluateDefense?(request: AIDefenseEvaluationRequest): Promise<AIDefenseEvaluationResult>;
}
