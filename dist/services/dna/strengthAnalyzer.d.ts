import { IReview, IDnaStrength } from '../../models';
export declare class StrengthAnalyzer {
    private static readonly STRENGTH_THRESHOLD;
    static analyzeStrengths(reviews: IReview[], categoryScores: Record<string, number>): IDnaStrength[];
}
