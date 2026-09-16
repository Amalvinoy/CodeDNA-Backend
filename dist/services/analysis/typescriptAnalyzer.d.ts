import { ILanguageAnalyzer, StaticAnalysisResult } from './analyzer.interface';
export declare class TypeScriptAnalyzer implements ILanguageAnalyzer {
    readonly language: "typescript";
    private jsAnalyzer;
    analyze(sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
