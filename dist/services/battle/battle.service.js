"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleService = void 0;
const models_1 = require("../../models");
const battleEngine_1 = require("./battleEngine");
const dna_service_1 = require("../dna.service");
const aiService_1 = require("../ai/aiService");
class BattleService {
    static async generateBattle(userId, input) {
        const dna = await dna_service_1.DnaService.getDnaProfile(userId);
        const dnaWeaknesses = dna?.recurringWeaknesses?.map((w) => w.title) || [];
        const result = await battleEngine_1.BattleEngine.evaluateBattle({
            ...input,
            dnaWeaknesses,
        });
        await models_1.CodeBattle.findOneAndUpdate({ userId }, {
            $set: {
                file: result.file,
                originalCode: result.originalCode,
                optimizedCode: result.optimizedCode,
                originalScore: result.originalScore,
                optimizedScore: result.optimizedScore,
                scoreDelta: result.scoreDelta,
                winner: result.winner,
                complexityOriginal: result.complexityOriginal,
                complexityOptimized: result.complexityOptimized,
                originalFindings: result.originalFindings,
                optimizedFindings: result.optimizedFindings,
                metrics: result.metrics,
                winnerExplanation: result.winnerExplanation,
                summary: result.summary,
                changes: result.changes,
            },
        }, { upsert: true, new: true });
        return result;
    }
    static async getBattleData(userId) {
        return await models_1.CodeBattle.findOne({ userId });
    }
    static async submitDefense(userId, reasoning) {
        if (!reasoning || reasoning.trim().length === 0) {
            return {
                success: false,
                message: 'Defense reasoning cannot be empty.',
                pointsAwarded: 0,
            };
        }
        const currentBattle = await models_1.CodeBattle.findOne({ userId });
        const defenseEvaluation = await aiService_1.AIService.evaluateDefense({
            originalCode: currentBattle?.originalCode,
            optimizedCode: currentBattle?.optimizedCode,
            defenseReasoning: reasoning.trim(),
        });
        return {
            success: true,
            message: 'Defense rationale evaluated successfully.',
            evaluation: defenseEvaluation.evaluation,
            pointsAwarded: defenseEvaluation.pointsAwarded,
        };
    }
}
exports.BattleService = BattleService;
//# sourceMappingURL=battle.service.js.map