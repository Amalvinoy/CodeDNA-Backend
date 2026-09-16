import { CodeBattleRequest, CodeBattleResult } from './battle.interface';
export declare class BattleEngine {
    static evaluateBattle(request: CodeBattleRequest): Promise<CodeBattleResult>;
}
