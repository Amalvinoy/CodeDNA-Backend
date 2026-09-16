"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeOptimizerService = void 0;
const aiService_1 = require("../ai/aiService");
class CodeOptimizerService {
    /**
     * Generates real AI-assisted code optimization via centralized AIService.
     * Works on arbitrary code without canned regex templates.
     * Never executes code.
     */
    static async generateOptimizedCode(input) {
        return await aiService_1.AIService.optimize({
            language: input.language,
            fileName: input.fileName,
            originalCode: input.originalCode,
            staticFindings: input.findings,
            historicalRules: input.historicalRules,
            dnaWeaknesses: input.dnaWeaknesses,
        });
    }
}
exports.CodeOptimizerService = CodeOptimizerService;
//# sourceMappingURL=codeOptimizer.service.js.map