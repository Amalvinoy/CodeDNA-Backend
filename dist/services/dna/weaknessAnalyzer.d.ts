import { IReview, IDnaPattern, IDnaAreaForOptimization } from '../../models';
export interface PatternAggregationResult {
    allPatterns: IDnaPattern[];
    recurringWeaknesses: IDnaPattern[];
    areasForOptimization: IDnaAreaForOptimization[];
    patternHistory: {
        category: string;
        pastFrequency: number;
        currentFrequency: number;
    }[];
}
export declare class WeaknessAnalyzer {
    static analyzePatternsAndWeaknesses(reviews: IReview[]): PatternAggregationResult;
}
