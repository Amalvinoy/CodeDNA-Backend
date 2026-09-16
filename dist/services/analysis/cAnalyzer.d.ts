import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class CAnalyzer implements ILanguageAnalyzer {
    readonly language: "c";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
