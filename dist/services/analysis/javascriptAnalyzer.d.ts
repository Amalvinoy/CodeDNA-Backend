import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class JavaScriptAnalyzer implements ILanguageAnalyzer {
    readonly language: "javascript";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
