import { ICodeFinding, IMatchedHistoricalRule } from '../../models';
import { AIOptimizationResult } from '../ai/aiProvider.interface';
export declare class CodeOptimizerService {
    /**
     * Generates real AI-assisted code optimization via centralized AIService.
     * Works on arbitrary code without canned regex templates.
     * Never executes code.
     */
    static generateOptimizedCode(input: {
        language: string;
        fileName: string;
        originalCode: string;
        findings: ICodeFinding[];
        historicalRules?: IMatchedHistoricalRule[];
        dnaWeaknesses?: string[];
    }): Promise<AIOptimizationResult>;
}
