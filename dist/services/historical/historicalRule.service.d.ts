import { IHistoricalRule } from '../../models';
export interface GetHistoricalRulesParams {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class HistoricalRuleService {
    static getAllRules(params?: GetHistoricalRulesParams): Promise<{
        rules: IHistoricalRule[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getRuleById(id: string): Promise<IHistoricalRule | null>;
}
