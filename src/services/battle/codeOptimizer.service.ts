import { ICodeFinding, IMatchedHistoricalRule } from '../../models';
import { AIService } from '../ai/aiService';
import { AIOptimizationResult } from '../ai/aiProvider.interface';

export class CodeOptimizerService {
  /**
   * Generates real AI-assisted code optimization via centralized AIService.
   * Works on arbitrary code without canned regex templates.
   * Never executes code.
   */
  static async generateOptimizedCode(input: {
    language: string;
    fileName: string;
    originalCode: string;
    findings: ICodeFinding[];
    historicalRules?: IMatchedHistoricalRule[];
    dnaWeaknesses?: string[];
  }): Promise<AIOptimizationResult> {
    return await AIService.optimize({
      language: input.language,
      fileName: input.fileName,
      originalCode: input.originalCode,
      staticFindings: input.findings,
      historicalRules: input.historicalRules,
      dnaWeaknesses: input.dnaWeaknesses,
    });
  }
}
