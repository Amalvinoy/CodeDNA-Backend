import { ICodeFinding } from '../../models';
export interface NormalizedPatternInfo {
    key: string;
    category: 'correctness' | 'security' | 'performance' | 'architecture' | 'maintainability' | 'style';
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}
export declare class PatternNormalizer {
    static normalizeFinding(finding: ICodeFinding): NormalizedPatternInfo;
}
