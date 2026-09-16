"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalAnalysisHook = void 0;
const historicalRetriever_1 = require("./historicalRetriever");
class HistoricalAnalysisHook {
    static async analyze(sourceCode, language, findings) {
        const result = await historicalRetriever_1.HistoricalRetriever.retrieveRelevantRules({
            code: sourceCode,
            language,
            findings,
            limit: 3,
        });
        return {
            matches: result.matches,
            rulesUsedCount: result.rulesUsedCount,
            retrievalMethod: result.retrievalMethod,
        };
    }
}
exports.HistoricalAnalysisHook = HistoricalAnalysisHook;
//# sourceMappingURL=historicalHook.js.map