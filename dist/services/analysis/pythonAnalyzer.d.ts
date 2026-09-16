import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class PythonAnalyzer implements ILanguageAnalyzer {
    readonly language: "python";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
