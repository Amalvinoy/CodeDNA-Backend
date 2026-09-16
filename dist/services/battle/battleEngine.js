"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleEngine = void 0;
const analyzerRegistry_1 = require("../analysis/analyzerRegistry");
const scoringService_1 = require("../scoring/scoringService");
const codeOptimizer_service_1 = require("./codeOptimizer.service");
const historical_1 = require("../historical");
class BattleEngine {
    static async evaluateBattle(request) {
        const { file, language, originalCode, dnaWeaknesses } = request;
        const lang = (language || 'typescript').toLowerCase();
        // 1. Analyze Original Code through the Standard AST Pipeline
        const originalStatic = await analyzerRegistry_1.AnalyzerRegistry.analyze(lang, originalCode, file);
        const originalScoreResult = scoringService_1.ScoringService.calculateQualityScore(originalStatic.findings);
        // 2. Retrieve Relevant Grounded Historical Engineering Memory Rules
        let historicalMatches = [];
        try {
            const historicalResult = await historical_1.HistoricalRetriever.retrieveRelevantRules({
                code: originalCode,
                language: lang,
                limit: 3,
            });
            historicalMatches = historicalResult.matches || [];
        }
        catch (e) {
            // Historical memory optional fallback
            historicalMatches = [];
        }
        // 3. Generate Candidate AI-Optimized Code via Centralized AI Provider
        const optimizationResult = await codeOptimizer_service_1.CodeOptimizerService.generateOptimizedCode({
            language: lang,
            fileName: file,
            originalCode,
            findings: originalStatic.findings,
            historicalRules: historicalMatches,
            dnaWeaknesses,
        });
        const optimizedCode = optimizationResult.optimizedCode;
        // 4. Analyze Candidate Code through the EXACT SAME Pipeline
        const optimizedStatic = await analyzerRegistry_1.AnalyzerRegistry.analyze(lang, optimizedCode, file);
        const optimizedScoreResult = scoringService_1.ScoringService.calculateQualityScore(optimizedStatic.findings);
        // 5. Complexity Determination (Strictly no fabrication - must not claim O(1) unless established)
        const complexityOriginal = 'Not determined';
        const complexityOptimized = 'Not determined';
        // 6. Real Quality Scores & Delta (No artificial Math.max clamps)
        const originalScore = Number(originalScoreResult.score.toFixed(1));
        const optimizedScore = Number(optimizedScoreResult.score.toFixed(1));
        const scoreDelta = Number((optimizedScore - originalScore).toFixed(1));
        // 7. Measured Winner Determination
        let winner;
        if (optimizedScore > originalScore) {
            winner = 'AI Optimization';
        }
        else if (optimizedScore < originalScore) {
            winner = 'Original';
        }
        else {
            winner = 'Tie';
        }
        // 8. Factual Winner Explanation
        const originalFindingsCount = originalStatic.findings.length;
        const optimizedFindingsCount = optimizedStatic.findings.length;
        const eliminatedCount = originalFindingsCount - optimizedFindingsCount;
        let winnerExplanation = '';
        if (winner === 'AI Optimization') {
            const reductionText = eliminatedCount > 0
                ? ` Resolved ${eliminatedCount} static code smell/vulnerability finding(s) (from ${originalFindingsCount} down to ${optimizedFindingsCount}).`
                : '';
            winnerExplanation = `AI Optimization scored ${optimizedScore.toFixed(1)}/10.0 vs Original ${originalScore.toFixed(1)}/10.0 (+${scoreDelta} delta).${reductionText} ${optimizationResult.summary || 'Demonstrates superior architectural adherence and metric safety.'}`;
        }
        else if (winner === 'Original') {
            winnerExplanation = `Original implementation scored ${originalScore.toFixed(1)}/10.0 vs AI Optimization ${optimizedScore.toFixed(1)}/10.0 (${scoreDelta} delta). The original source code demonstrated higher structural compliance with analyzer metrics than the candidate refactoring.`;
        }
        else {
            winnerExplanation = `Both implementations achieved an identical score of ${originalScore.toFixed(1)}/10.0 with comparable code health metrics.`;
        }
        // 9. Exact Metrics (Normalized to 0-100 scale, no artificial score floors)
        return {
            file,
            originalCode,
            optimizedCode,
            originalScore,
            optimizedScore,
            scoreDelta,
            complexityOriginal,
            complexityOptimized,
            originalFindings: originalStatic.findings,
            optimizedFindings: optimizedStatic.findings,
            metrics: {
                security: {
                    original: Math.round(originalScoreResult.metrics.security * 10),
                    optimized: Math.round(optimizedScoreResult.metrics.security * 10),
                },
                performance: {
                    original: Math.round(originalScoreResult.metrics.performance * 10),
                    optimized: Math.round(optimizedScoreResult.metrics.performance * 10),
                },
                maintainability: {
                    original: Math.round(originalScoreResult.metrics.maintainability * 10),
                    optimized: Math.round(optimizedScoreResult.metrics.maintainability * 10),
                },
            },
            winner,
            winnerExplanation,
            summary: optimizationResult.summary,
            changes: optimizationResult.changes,
        };
    }
}
exports.BattleEngine = BattleEngine;
//# sourceMappingURL=battleEngine.js.map