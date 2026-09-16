import { ICodeBattle } from '../models';
export declare class BattleService {
    static getBattleData(userId: string): Promise<ICodeBattle | null>;
    static submitDefense(userId: string, reasoning: string): Promise<{
        success: boolean;
        aiFeedback: string;
    }>;
}
