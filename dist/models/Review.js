"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CodeFindingSchema = new mongoose_1.Schema({
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
}, { _id: false });
const ReviewMetricsSchema = new mongoose_1.Schema({
    correctness: { type: Number, default: 8.5 },
    security: { type: Number, default: 9.0 },
    performance: { type: Number, default: 8.0 },
    architecture: { type: Number, default: 7.5 },
    maintainability: { type: Number, default: 8.0 },
}, { _id: false });
const AnalysisMetadataSchema = new mongoose_1.Schema({
    analyzerUsed: { type: String, default: 'Hybrid (Static + AI)' },
    executionTimeMs: { type: Number, default: 0 },
    aiModel: { type: String },
    languageDetected: { type: String },
}, { _id: false });
const MatchedHistoricalRuleSchema = new mongoose_1.Schema({
    ruleId: { type: String, required: true },
    externalId: { type: String },
    type: { type: String, required: true },
    description: { type: String, required: true },
    similarity: { type: Number, required: true },
    relevance: { type: String, default: 'high' },
    reason: { type: String },
}, { _id: false });
const ReviewHistoricalContextSchema = new mongoose_1.Schema({
    matchedRules: [MatchedHistoricalRuleSchema],
    rulesUsedCount: { type: Number, default: 0 },
    retrievalMethod: {
        type: String,
        enum: ['vector', 'semantic-hybrid', 'none'],
        default: 'none',
    },
}, { _id: false });
const ReviewRiskForecastSchema = new mongoose_1.Schema({
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
}, { _id: false });
const ReviewSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
});
ReviewSchema.index({ userId: 1, createdAt: -1 });
exports.Review = mongoose_1.default.models.Review || mongoose_1.default.model('Review', ReviewSchema);
//# sourceMappingURL=Review.js.map