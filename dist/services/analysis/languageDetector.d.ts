import { SupportedLanguage } from './analyzer.interface';
/**
 * Strips comments and string literals so language syntax signature detection
 * operates purely on actual code structure rather than text inside strings or comments.
 */
export declare function stripCommentsAndStrings(code: string): string;
export declare class LanguageDetector {
    private static readonly SUPPORTED_LANGUAGES;
    private static readonly DISPLAY_NAMES;
    static normalizeLanguage(input: string): SupportedLanguage | null;
    static getDisplayName(lang: SupportedLanguage): string;
    static getSupportedLanguagesList(): string[];
    /**
     * Evaluates source code structure against syntax signatures of supported languages.
     * Comments and string literals are stripped first to avoid false positives.
     */
    static validateLanguageWithCode(selectedLanguage: SupportedLanguage, sourceCode: string): {
        isValid: boolean;
        warning?: string;
        suggestedLanguage?: SupportedLanguage;
    };
}
