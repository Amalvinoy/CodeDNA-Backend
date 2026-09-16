import mongoose, { Document } from 'mongoose';
export interface ICodeFinding {
    id: string;
    category: 'correctness' | 'security' | 'performance' | 'architecture' | 'maintainability' | 'style';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    lineStart: number;
    lineEnd: number;
    columnStart?: number;
    columnEnd?: number;
    codeSnippet: string;
    whyItMatters: string;
    suggestedFix: string;
    confidence: number;
    historicalRuleId?: string;
    historicalMatch?: boolean;
    historicalSimilarity?: number;
    historicalMatchPercent?: number;
    codeContextSnippet?: {
        startLine: number;
        lines: {
            lineNumber: number;
            code: string;
            isHighlighted?: boolean;
        }[];
    };
}
export interface IReviewMetrics {
    correctness: number;
    security: number;
    performance: number;
    architecture: number;
    maintainability: number;
}
export interface IAnalysisMetadata {
    analyzerUsed: string;
    executionTimeMs: number;
    aiModel?: string;
    languageDetected?: string;
}
export interface IMatchedHistoricalRule {
    ruleId: string;
    externalId?: string;
    type: string;
    description: string;
    similarity: number;
    relevance: string;
    reason?: string;
}
export interface IReviewHistoricalContext {
    matchedRules: IMatchedHistoricalRule[];
    rulesUsedCount: number;
    retrievalMethod: 'vector' | 'semantic-hybrid' | 'none';
}
export interface IReviewRiskForecast {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskPercent: number;
    confidence: number;
    personalization: 'personalized' | 'insufficient_history';
    primaryFactor: string;
    recommendation: string;
}
export interface IReview extends Document {
    userId: string;
    reviewIdString: string;
    fileName: string;
    language: string;
    sourceCode: string;
    status: 'pending' | 'analyzing' | 'completed' | 'failed';
    qualityScore: number;
    scoreDelta: number;
    aiSummary: string;
    issuesCount: number;
    criticalCount: number;
    warningCount: number;
    findings: ICodeFinding[];
    metrics: IReviewMetrics;
    analysisMetadata: IAnalysisMetadata;
    historicalContext: IReviewHistoricalContext;
    riskForecast?: IReviewRiskForecast;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Review: mongoose.Model<any, {}, {}, {}, any, any>;
