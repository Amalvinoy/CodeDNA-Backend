"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskService = void 0;
const models_1 = require("../models");
class RiskService {
    static async getPredictiveRisk(userId) {
        return await models_1.RiskPrediction.findOne({ userId });
    }
}
exports.RiskService = RiskService;
//# sourceMappingURL=risk.service.js.map