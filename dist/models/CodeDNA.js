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
exports.CodeDNA = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CodeDNASchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    overallScore: { type: Number, required: true, default: 0 },
    maxScore: { type: Number, default: 100 },
    consistencyScore: { type: Number, default: 0 },
    improvementMonthPercent: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    levelTitle: { type: String, default: 'NEW DEVELOPER' },
    progressToNextLevel: { type: Number, default: 0 },
    attributes: {
        security: { type: Number, default: 0 },
        correctness: { type: Number, default: 0 },
        maintainability: { type: Number, default: 0 },
        architecture: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
    },
    categoryScores: {
        correctness: { type: Number, default: 0 },
        security: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        architecture: { type: Number, default: 0 },
        maintainability: { type: Number, default: 0 },
        style: { type: Number, default: 0 },
    },
    metrics: {
        codeComplexity: { type: Number, default: 0 },
        testCoverage: { type: Number, default: 0 },
        modularity: { type: Number, default: 0 },
        recurringBugFrequency: { type: Number, default: 0 },
        codeEfficiency: { type: Number, default: 0 },
    },
    strengths: [
        {
            id: { type: String },
            category: { type: String },
            title: { type: String },
            percentile: { type: String },
            description: { type: String },
            score: { type: Number },
            confidence: { type: Number },
            color: { type: String, enum: ['green', 'blue'], default: 'green' },
        },
    ],
    areasForOptimization: [
        {
            id: { type: String },
            key: { type: String },
            category: { type: String },
            title: { type: String },
            priority: { type: String, enum: ['High Priority', 'Medium Priority', 'Low Priority'], default: 'Medium Priority' },
            description: { type: String },
            occurrenceCount: { type: Number },
        },
    ],
    recurringWeaknesses: [
        {
            key: { type: String },
            category: { type: String },
            title: { type: String },
            description: { type: String },
            occurrenceCount: { type: Number },
            pastFrequency: { type: Number },
            currentFrequency: { type: Number },
            trend: { type: String, enum: ['improving', 'declining', 'recurring', 'stable'], default: 'recurring' },
            confidence: { type: Number },
            firstDetectedAt: { type: Date },
            lastDetectedAt: { type: Date },
            affectedReviews: [{ type: String }],
        },
    ],
    patterns: [
        {
            key: { type: String },
            category: { type: String },
            title: { type: String },
            description: { type: String },
            occurrenceCount: { type: Number },
            pastFrequency: { type: Number },
            currentFrequency: { type: Number },
            trend: { type: String, enum: ['improving', 'declining', 'recurring', 'stable'], default: 'stable' },
            confidence: { type: Number },
            firstDetectedAt: { type: Date },
            lastDetectedAt: { type: Date },
            affectedReviews: [{ type: String }],
        },
    ],
    trends: [
        {
            category: { type: String },
            direction: { type: String, enum: ['improving', 'declining', 'stable'] },
            delta: { type: Number },
            currentScore: { type: Number },
            previousScore: { type: Number },
        },
    ],
    evolutionTrajectory: [
        {
            month: { type: String },
            score: { type: Number },
        },
    ],
    patternHistory: [
        {
            category: { type: String },
            pastFrequency: { type: Number },
            currentFrequency: { type: Number },
        },
    ],
    languages: [
        {
            language: { type: String },
            percentage: { type: Number },
            count: { type: Number },
        },
    ],
    reviewCount: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
}, {
    timestamps: true,
});
exports.CodeDNA = mongoose_1.default.models.CodeDNA || mongoose_1.default.model('CodeDNA', CodeDNASchema);
//# sourceMappingURL=CodeDNA.js.map