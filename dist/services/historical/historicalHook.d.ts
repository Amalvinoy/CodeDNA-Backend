import { ICodeFinding, IMatchedHistoricalRule } from '../../models';
export interface HistoricalAnalysisResult {
    matches: IMatchedHistoricalRule[];
    rulesUsedCount: number;
    retrievalMethod: 'vector' | 'semantic-hybrid' | 'none';
}
export declare class HistoricalAnalysisHook {
    static analyze(sourceCode: string, language: string, findings?: ICodeFinding[]): Promise<HistoricalAnalysisResult>;
}
