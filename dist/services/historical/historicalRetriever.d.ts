import { ICodeFinding, IMatchedHistoricalRule } from '../../models';
export interface RetrieveRulesParams {
    code: string;
    language: string;
    findings?: ICodeFinding[];
    limit?: number;
    threshold?: number;
}
export interface RetrievalResult {
    matches: IMatchedHistoricalRule[];
    rulesUsedCount: number;
    retrievalMethod: 'vector' | 'semantic-hybrid' | 'none';
}
export declare class HistoricalRetriever {
    private static readonly DEFAULT_THRESHOLD;
    private static readonly DEFAULT_TOP_K;
    static retrieveRelevantRules(params: RetrieveRulesParams): Promise<RetrievalResult>;
}
