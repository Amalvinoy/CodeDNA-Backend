"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzerRegistry = void 0;
const javascriptAnalyzer_1 = require("./javascriptAnalyzer");
const typescriptAnalyzer_1 = require("./typescriptAnalyzer");
const pythonAnalyzer_1 = require("./pythonAnalyzer");
const javaAnalyzer_1 = require("./javaAnalyzer");
const cppAnalyzer_1 = require("./cppAnalyzer");
const cAnalyzer_1 = require("./cAnalyzer");
const goAnalyzer_1 = require("./goAnalyzer");
const rustAnalyzer_1 = require("./rustAnalyzer");
const phpAnalyzer_1 = require("./phpAnalyzer");
const sqlAnalyzer_1 = require("./sqlAnalyzer");
class AnalyzerRegistry {
    static analyzers = new Map([
        ['javascript', new javascriptAnalyzer_1.JavaScriptAnalyzer()],
        ['typescript', new typescriptAnalyzer_1.TypeScriptAnalyzer()],
        ['python', new pythonAnalyzer_1.PythonAnalyzer()],
        ['java', new javaAnalyzer_1.JavaAnalyzer()],
        ['cpp', new cppAnalyzer_1.CppAnalyzer()],
        ['c', new cAnalyzer_1.CAnalyzer()],
        ['go', new goAnalyzer_1.GoAnalyzer()],
        ['rust', new rustAnalyzer_1.RustAnalyzer()],
        ['php', new phpAnalyzer_1.PhpAnalyzer()],
        ['sql', new sqlAnalyzer_1.SqlAnalyzer()],
    ]);
    static getAnalyzer(language) {
        return this.analyzers.get(language);
    }
    static async analyze(language, sourceCode, fileName) {
        const analyzer = this.getAnalyzer(language);
        if (analyzer) {
            return await analyzer.analyze(sourceCode, fileName);
        }
        // Default fallback
        return {
            findings: [],
            metrics: {
                correctness: 8.5,
                security: 8.5,
                performance: 8.5,
                architecture: 8.5,
                maintainability: 8.5,
            },
            staticRulesApplied: 0,
        };
    }
}
exports.AnalyzerRegistry = AnalyzerRegistry;
//# sourceMappingURL=analyzerRegistry.js.map