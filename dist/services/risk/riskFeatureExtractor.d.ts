import { RiskForecastRequest, RiskEvidenceItem } from './risk.interface';
export interface ExtractedRiskFeatures {
    hasCriticalFinding: boolean;
    hasHighFinding: boolean;
    totalFindingsCount: number;
    categoryFindingCounts: Record<string, number>;
    categoryWeaknessMatches: Record<string, number>;
    matchedHistoricalRulesCount: number;
    evidence: RiskEvidenceItem[];
    isPersonalized: boolean;
}
export declare class RiskFeatureExtractor {
    static extractFeatures(request: RiskForecastRequest): ExtractedRiskFeatures;
}
