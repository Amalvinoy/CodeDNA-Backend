import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class CppAnalyzer implements ILanguageAnalyzer {
    readonly language: "cpp";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
