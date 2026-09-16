import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class SqlAnalyzer implements ILanguageAnalyzer {
    readonly language: "sql";
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
