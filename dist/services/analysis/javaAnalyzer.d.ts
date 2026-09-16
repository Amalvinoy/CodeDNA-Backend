import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class JavaAnalyzer implements ILanguageAnalyzer {
    readonly language: "java";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
