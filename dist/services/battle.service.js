"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleService = void 0;
const models_1 = require("../models");
class BattleService {
    static async getBattleData(userId) {
        return await models_1.CodeBattle.findOne({ userId });
    }
    static async submitDefense(userId, reasoning) {
        return {
            success: true,
            aiFeedback: `AI Counter-Analysis: While your defense rationale ("${reasoning.substring(0, 60)}...") highlights imperative simplicity, the AI implementation guarantees immutability, type safety with DataItem interface, and simplifies parallel stream pipelining.`,
        };
    }
}
exports.BattleService = BattleService;
//# sourceMappingURL=battle.service.js.map