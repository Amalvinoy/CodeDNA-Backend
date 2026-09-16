import { ICodeFinding } from '../../models';

export interface CodeBattleRequest {
  file: string;
  language: string;
  originalCode: string;
  dnaWeaknesses?: string[];
}

export interface CodeBattleResult {
  file: string;
  originalCode: string;
  optimizedCode: string;
  originalScore: number;
  optimizedScore: number;
  scoreDelta: number;
  complexityOriginal: string;
  complexityOptimized: string;
  originalFindings: ICodeFinding[];
  optimizedFindings: ICodeFinding[];
  metrics: {
    security: { original: number; optimized: number };
    performance: { original: number; optimized: number };
    maintainability: { original: number; optimized: number };
  };
  winner: 'Original' | 'AI Optimization' | 'Tie';
  winnerExplanation: string;
  summary?: string;
  changes?: Array<{ category: string; explanation: string }>;
}
