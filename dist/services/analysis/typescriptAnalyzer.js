"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptAnalyzer = void 0;
const contextSnippetHelper_1 = require("./contextSnippetHelper");
const javascriptAnalyzer_1 = require("./javascriptAnalyzer");
class TypeScriptAnalyzer {
    language = 'typescript';
    jsAnalyzer = new javascriptAnalyzer_1.JavaScriptAnalyzer();
    async analyze(sourceCode, fileName = 'file.ts') {
        // Run core JavaScript analysis first
        const baseResult = await this.jsAnalyzer.analyze(sourceCode, fileName);
        const findings = [...baseResult.findings];
        const lines = sourceCode.split('\n');
        let anyCount = 0;
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            // 1. Explicit `any` type usage
            if (/:\s*any\b|<any>|as\s+any\b/.test(trimmed) && !trimmed.startsWith('//')) {
                anyCount++;
                if (anyCount <= 2) {
                    findings.push({
                        id: `ts-type-any-${lineNum}`,
                        category: 'maintainability',
                        severity: 'medium',
                        title: 'Avoid Unsafe `any` Type Usage',
                        description: 'Using `any` disables TypeScript compiler type checking, removing compile-time type safety guarantees.',
                        lineStart: lineNum,
                        lineEnd: lineNum,
                        codeSnippet: trimmed,
                        whyItMatters: 'Unchecked property access on `any` types causes runtime `TypeError: Cannot read properties of undefined`.',
                        suggestedFix: 'Replace `any` with a specific interface, generic type parameter, or `unknown` with runtime type narrowing.',
                        confidence: 0.9,
                        codeContextSnippet: (0, contextSnippetHelper_1.generateCodeContextSnippet)(sourceCode, lineNum),
                    });
                }
            }
            // 2. Non-null assertion operator (!)
            if (/\w+!\.\w+/.test(trimmed) && !trimmed.startsWith('//')) {
                findings.push({
                    id: `ts-type-nonnull-${lineNum}`,
                    category: 'correctness',
                    severity: 'medium',
                    title: 'Unchecked Non-Null Assertion (!)',
                    description: 'Non-null assertion operator `!` silences null/undefined checks without verifying existence at runtime.',
                    lineStart: lineNum,
                    lineEnd: lineNum,
                    codeSnippet: trimmed,
                    whyItMatters: 'If the value is null or undefined at runtime, this causes an immediate unhandled crash.',
                    suggestedFix: 'Use optional chaining (`?.`) or add an explicit guard check before access.',
                    confidence: 0.88,
                    codeContextSnippet: (0, contextSnippetHelper_1.generateCodeContextSnippet)(sourceCode, lineNum),
                });
            }
        });
        const maintainabilityScore = anyCount > 2 ? 7.2 : 8.8;
        return {
            findings,
            metrics: {
                ...baseResult.metrics,
                maintainability: maintainabilityScore,
            },
            staticRulesApplied: baseResult.staticRulesApplied + 8,
        };
    }
}
exports.TypeScriptAnalyzer = TypeScriptAnalyzer;
//# sourceMappingURL=typescriptAnalyzer.js.map