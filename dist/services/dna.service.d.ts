import { ICodeDNA } from '../models';
export declare class DnaService {
    static getDnaProfile(userId: string): Promise<ICodeDNA>;
    static calculateAndSaveDNA(userId: string): Promise<ICodeDNA>;
    static getDnaSummary(userId: string): Promise<{
        overallScore: number;
        level: number;
        levelTitle: string;
        reviewCount: number;
        consistencyScore: number;
        strengthsCount: number;
        weaknessesCount: number;
        improvementMonthPercent: number;
    }>;
    static getDnaPatterns(userId: string): Promise<{
        patterns: import("../models").IDnaPattern[];
        recurringWeaknesses: import("../models").IDnaPattern[];
        patternHistory: {
            category: string;
            pastFrequency: number;
            currentFrequency: number;
        }[];
    }>;
    static getDnaTrends(userId: string): Promise<{
        trends: import("../models").IDnaTrend[];
        evolutionTrajectory: {
            month: string;
            score: number;
        }[];
        improvementMonthPercent: number;
    }>;
    static rebuildCodeDNA(userId: string): Promise<ICodeDNA>;
}
