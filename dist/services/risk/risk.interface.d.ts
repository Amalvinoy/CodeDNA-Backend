import { ICodeFinding, IMatchedHistoricalRule, ICodeDNA } from '../../models';
export interface RiskForecastRequest {
    language: string;
    fileName: string;
    sourceCode: string;
    findings?: ICodeFinding[];
    historicalRules?: IMatchedHistoricalRule[];
    dna?: ICodeDNA | null;
}
export interface RiskEvidenceItem {
    type: 'current_finding' | 'developer_pattern' | 'historical_rule';
    category: string;
    description: string;
    ruleId?: string;
    severity?: string;
}
export interface CategoryRiskScore {
    category: 'security' | 'performance' | 'correctness' | 'architecture' | 'maintainability' | 'style';
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    evidence: RiskEvidenceItem[];
}
export interface RiskForecastResult {
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    overallRiskPercent: number;
    confidencePercent: number;
    personalization: 'personalized' | 'insufficient_history';
    primaryCategory: string;
    recommendation: string;
    summary: string;
    categoryRisks: CategoryRiskScore[];
    primaryFactors: {
        id: string;
        label: string;
        impactPercent: number;
        color: 'red' | 'amber' | 'cyan';
    }[];
    evidence: RiskEvidenceItem[];
}
