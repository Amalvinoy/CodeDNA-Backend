import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class GoAnalyzer implements ILanguageAnalyzer {
    readonly language: "go";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
