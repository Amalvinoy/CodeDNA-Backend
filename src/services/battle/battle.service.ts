import { CodeBattle, ICodeBattle } from '../../models';
import { BattleEngine } from './battleEngine';
import { CodeBattleResult } from './battle.interface';
import { DnaService } from '../dna.service';
import { AIService } from '../ai/aiService';

export class BattleService {
  static async generateBattle(
    userId: string,
    input: {
      file: string;
      language: string;
      originalCode: string;
    }
  ): Promise<CodeBattleResult> {
    const dna = await DnaService.getDnaProfile(userId);
    const dnaWeaknesses = dna?.recurringWeaknesses?.map((w) => w.title) || [];

    const result = await BattleEngine.evaluateBattle({
      ...input,
      dnaWeaknesses,
    });

    await CodeBattle.findOneAndUpdate(
      { userId },
      {
        $set: {
          file: result.file,
          originalCode: result.originalCode,
          optimizedCode: result.optimizedCode,
          originalScore: result.originalScore,
          optimizedScore: result.optimizedScore,
          scoreDelta: result.scoreDelta,
          winner: result.winner,
          complexityOriginal: result.complexityOriginal,
          complexityOptimized: result.complexityOptimized,
          originalFindings: result.originalFindings,
          optimizedFindings: result.optimizedFindings,
          metrics: result.metrics,
          winnerExplanation: result.winnerExplanation,
          summary: result.summary,
          changes: result.changes,
        },
      },
      { upsert: true, new: true }
    );

    return result;
  }

  static async getBattleData(userId: string): Promise<ICodeBattle | null> {
    return await CodeBattle.findOne({ userId });
  }

  static async submitDefense(
    userId: string,
    reasoning: string
  ): Promise<{
    success: boolean;
    message: string;
    evaluation?: string;
    pointsAwarded: number;
  }> {
    if (!reasoning || reasoning.trim().length === 0) {
      return {
        success: false,
        message: 'Defense reasoning cannot be empty.',
        pointsAwarded: 0,
      };
    }

    const currentBattle = await CodeBattle.findOne({ userId });

    const defenseEvaluation = await AIService.evaluateDefense({
      originalCode: currentBattle?.originalCode,
      optimizedCode: currentBattle?.optimizedCode,
      defenseReasoning: reasoning.trim(),
    });

    return {
      success: true,
      message: 'Defense rationale evaluated successfully.',
      evaluation: defenseEvaluation.evaluation,
      pointsAwarded: defenseEvaluation.pointsAwarded,
    };
  }
}
