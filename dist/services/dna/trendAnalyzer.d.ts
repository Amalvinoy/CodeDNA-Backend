import { IReview, IDnaTrend } from '../../models';
export interface TrendAnalysisResult {
    trends: IDnaTrend[];
    evolutionTrajectory: {
        month: string;
        score: number;
    }[];
    improvementMonthPercent: number;
}
export declare class TrendAnalyzer {
    static analyzeTrends(reviews: IReview[]): TrendAnalysisResult;
}
