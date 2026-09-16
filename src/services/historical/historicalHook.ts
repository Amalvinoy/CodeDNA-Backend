import { HistoricalRetriever } from './historicalRetriever';
import { ICodeFinding, IMatchedHistoricalRule } from '../../models';

export interface HistoricalAnalysisResult {
  matches: IMatchedHistoricalRule[];
  rulesUsedCount: number;
  retrievalMethod: 'vector' | 'semantic-hybrid' | 'none';
}

export class HistoricalAnalysisHook {
  static async analyze(
    sourceCode: string,
    language: string,
    findings?: ICodeFinding[]
  ): Promise<HistoricalAnalysisResult> {
    const result = await HistoricalRetriever.retrieveRelevantRules({
      code: sourceCode,
      language,
      findings,
      limit: 3,
    });

    return {
      matches: result.matches,
      rulesUsedCount: result.rulesUsedCount,
      retrievalMethod: result.retrievalMethod,
    };
  }
}
