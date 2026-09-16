"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalRuleService = void 0;
const models_1 = require("../../models");
class HistoricalRuleService {
    static async getAllRules(params = {}) {
        const page = Math.max(1, params.page || 1);
        const limit = Math.max(1, Math.min(100, params.limit || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (params.category && params.category !== 'all') {
            query.type = params.category.toLowerCase();
        }
        if (params.search && params.search.trim()) {
            const regex = new RegExp(params.search.trim(), 'i');
            query.$or = [{ description: regex }, { type: regex }, { externalId: regex }];
        }
        const [rules, total] = await Promise.all([
            models_1.HistoricalRule.find(query).sort({ externalId: 1 }).skip(skip).limit(limit),
            models_1.HistoricalRule.countDocuments(query),
        ]);
        return {
            rules: rules,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    static async getRuleById(id) {
        return await models_1.HistoricalRule.findOne({
            $or: [{ externalId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
        });
    }
}
exports.HistoricalRuleService = HistoricalRuleService;
//# sourceMappingURL=historicalRule.service.js.map