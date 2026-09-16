import { HistoricalRule, IHistoricalRule } from '../../models';

export interface GetHistoricalRulesParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class HistoricalRuleService {
  static async getAllRules(params: GetHistoricalRulesParams = {}): Promise<{
    rules: IHistoricalRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.category && params.category !== 'all') {
      query.type = params.category.toLowerCase();
    }

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [{ description: regex }, { type: regex }, { externalId: regex }];
    }

    const [rules, total] = await Promise.all([
      HistoricalRule.find(query).sort({ externalId: 1 }).skip(skip).limit(limit),
      HistoricalRule.countDocuments(query),
    ]);

    return {
      rules: rules as unknown as IHistoricalRule[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getRuleById(id: string): Promise<IHistoricalRule | null> {
    return await HistoricalRule.findOne({
      $or: [{ externalId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });
  }
}
