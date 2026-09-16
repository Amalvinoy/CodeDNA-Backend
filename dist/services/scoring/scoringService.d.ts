import { ICodeFinding, IReviewMetrics } from '../../models';
export interface QualityScoreCalculationResult {
    score: number;
    scoreDelta: number;
    metrics: IReviewMetrics;
    issuesCount: number;
    criticalCount: number;
    warningCount: number;
}
export declare class ScoringService {
    private static readonly BASE_SCORE;
    static calculateQualityScore(findings: ICodeFinding[], baselineMetrics?: Partial<IReviewMetrics>): QualityScoreCalculationResult;
}
