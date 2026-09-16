import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class RustAnalyzer implements ILanguageAnalyzer {
    readonly language: "rust";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
