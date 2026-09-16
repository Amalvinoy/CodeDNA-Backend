import mongoose, { Document, Schema } from 'mongoose';

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

const CodeFindingSchema = new Schema<ICodeFinding>(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      enum: ['correctness', 'security', 'performance', 'architecture', 'maintainability', 'style'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    lineStart: { type: Number, required: true },
    lineEnd: { type: Number, required: true },
    columnStart: { type: Number },
    columnEnd: { type: Number },
    codeSnippet: { type: String, required: true },
    whyItMatters: { type: String, required: true },
    suggestedFix: { type: String, required: true },
    confidence: { type: Number, required: true, default: 0.9 },
    historicalRuleId: { type: String },
    historicalMatch: { type: Boolean, default: false },
    historicalSimilarity: { type: Number },
    historicalMatchPercent: { type: Number },
    codeContextSnippet: {
      startLine: { type: Number },
      lines: [
        {
          lineNumber: { type: Number },
          code: { type: String },
          isHighlighted: { type: Boolean },
        },
      ],
    },
  },
  { _id: false }
);

const ReviewMetricsSchema = new Schema<IReviewMetrics>(
  {
    correctness: { type: Number, default: 8.5 },
    security: { type: Number, default: 9.0 },
    performance: { type: Number, default: 8.0 },
    architecture: { type: Number, default: 7.5 },
    maintainability: { type: Number, default: 8.0 },
  },
  { _id: false }
);

const AnalysisMetadataSchema = new Schema<IAnalysisMetadata>(
  {
    analyzerUsed: { type: String, default: 'Hybrid (Static + AI)' },
    executionTimeMs: { type: Number, default: 0 },
    aiModel: { type: String },
    languageDetected: { type: String },
  },
  { _id: false }
);

const MatchedHistoricalRuleSchema = new Schema<IMatchedHistoricalRule>(
  {
    ruleId: { type: String, required: true },
    externalId: { type: String },
    type: { type: String, required: true },
    description: { type: String, required: true },
    similarity: { type: Number, required: true },
    relevance: { type: String, default: 'high' },
    reason: { type: String },
  },
  { _id: false }
);

const ReviewHistoricalContextSchema = new Schema<IReviewHistoricalContext>(
  {
    matchedRules: [MatchedHistoricalRuleSchema],
    rulesUsedCount: { type: Number, default: 0 },
    retrievalMethod: {
      type: String,
      enum: ['vector', 'semantic-hybrid', 'none'],
      default: 'none',
    },
  },
  { _id: false }
);

const ReviewRiskForecastSchema = new Schema<IReviewRiskForecast>(
  {
    overallRisk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    riskPercent: { type: Number, default: 20 },
    confidence: { type: Number, default: 0.8 },
    personalization: {
      type: String,
      enum: ['personalized', 'insufficient_history'],
      default: 'insufficient_history',
    },
    primaryFactor: { type: String },
    recommendation: { type: String },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    reviewIdString: {
      type: String,
      required: true,
      unique: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      default: 'source.code',
    },
    language: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'failed'],
      default: 'completed',
    },
    qualityScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 8.0,
    },
    scoreDelta: {
      type: Number,
      default: 0,
    },
    aiSummary: {
      type: String,
      required: true,
    },
    issuesCount: {
      type: Number,
      default: 0,
    },
    criticalCount: {
      type: Number,
      default: 0,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    findings: [CodeFindingSchema],
    metrics: {
      type: ReviewMetricsSchema,
      default: () => ({}),
    },
    analysisMetadata: {
      type: AnalysisMetadataSchema,
      default: () => ({}),
    },
    historicalContext: {
      type: ReviewHistoricalContextSchema,
      default: () => ({ matchedRules: [], rulesUsedCount: 0, retrievalMethod: 'none' }),
    },
    riskForecast: {
      type: ReviewRiskForecastSchema,
    },
  },
  {
    timestamps: true,
  }
);

ReviewSchema.index({ userId: 1, createdAt: -1 });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
