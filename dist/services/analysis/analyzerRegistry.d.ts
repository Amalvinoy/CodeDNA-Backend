import { ILanguageAnalyzer, SupportedLanguage, StaticAnalysisResult } from './analyzer.interface';
export declare class AnalyzerRegistry {
    private static analyzers;
    static getAnalyzer(language: SupportedLanguage): ILanguageAnalyzer | undefined;
    static analyze(language: SupportedLanguage, sourceCode: string, fileName?: string): Promise<StaticAnalysisResult>;
}
