"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryService = void 0;
const models_1 = require("../models");
class MemoryService {
    static async getMemoryRules() {
        return await models_1.HistoricalRule.find().sort({ matchPercent: -1 });
    }
}
exports.MemoryService = MemoryService;
//# sourceMappingURL=memory.service.js.map