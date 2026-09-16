import mongoose, { Document } from 'mongoose';
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
export declare const CodeDNA: mongoose.Model<any, {}, {}, {}, any, any>;
