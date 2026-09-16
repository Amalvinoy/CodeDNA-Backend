import mongoose, { Document, Schema } from 'mongoose';

export interface IDnaStrength {
  id: string;
  category?: string;
  title: string;
  percentile: string;
  description: string;
  score?: number;
  confidence?: number;
  color: 'green' | 'blue';
}

export interface IDnaAreaForOptimization {
  id: string;
  key?: string;
  category?: string;
  title: string;
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  description: string;
  occurrenceCount?: number;
}

export interface IDnaPattern {
  key: string;
  category: string;
  title: string;
  description: string;
  occurrenceCount: number;
  pastFrequency: number;
  currentFrequency: number;
  trend: 'improving' | 'declining' | 'recurring' | 'stable';
  confidence: number;
  firstDetectedAt: Date;
  lastDetectedAt: Date;
  affectedReviews?: string[];
}

export interface IDnaTrend {
  category: string;
  direction: 'improving' | 'declining' | 'stable';
  delta: number;
  currentScore: number;
  previousScore: number;
}

export interface IDnaLanguage {
  language: string;
  percentage: number;
  count: number;
}

export interface ICodeDNA extends Document {
  userId: string;
  overallScore: number;
  maxScore: number;
  consistencyScore: number;
  improvementMonthPercent: number;
  level: number;
  levelTitle: string;
  progressToNextLevel: number;
  attributes: {
    security: number;
    correctness: number;
    maintainability: number;
    architecture: number;
    performance: number;
  };
  categoryScores: {
    correctness: number;
    security: number;
    performance: number;
    architecture: number;
    maintainability: number;
    style: number;
  };
  metrics: {
    codeComplexity: number;
    testCoverage: number;
    modularity: number;
    recurringBugFrequency: number;
    codeEfficiency: number;
  };
  strengths: IDnaStrength[];
  areasForOptimization: IDnaAreaForOptimization[];
  recurringWeaknesses: IDnaPattern[];
  patterns: IDnaPattern[];
  trends: IDnaTrend[];
  evolutionTrajectory: {
    month: string;
    score: number;
  }[];
  patternHistory: {
    category: string;
    pastFrequency: number;
    currentFrequency: number;
  }[];
  languages: IDnaLanguage[];
  reviewCount: number;
  lastCalculatedAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const CodeDNASchema = new Schema<ICodeDNA>(
  {
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
  },
  {
    timestamps: true,
  }
);

export const CodeDNA =
  mongoose.models.CodeDNA || mongoose.model<ICodeDNA>('CodeDNA', CodeDNASchema);
