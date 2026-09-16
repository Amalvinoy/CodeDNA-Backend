import { ICodeBattle } from '../../models';
import { CodeBattleResult } from './battle.interface';
export declare class BattleService {
    static generateBattle(userId: string, input: {
        file: string;
        language: string;
        originalCode: string;
    }): Promise<CodeBattleResult>;
    static getBattleData(userId: string): Promise<ICodeBattle | null>;
    static submitDefense(userId: string, reasoning: string): Promise<{
        success: boolean;
        message: string;
        evaluation?: string;
        pointsAwarded: number;
    }>;
}
