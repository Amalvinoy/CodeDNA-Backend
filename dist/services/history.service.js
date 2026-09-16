"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryService = void 0;
const models_1 = require("../models");
class HistoryService {
    static async getDiagnosticLogs(userId) {
        return await models_1.Review.find({ userId }).sort({ createdAt: -1 });
    }
}
exports.HistoryService = HistoryService;
//# sourceMappingURL=history.service.js.map