import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class PhpAnalyzer implements ILanguageAnalyzer {
    readonly language: "php";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
