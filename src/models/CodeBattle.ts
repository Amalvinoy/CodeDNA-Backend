import mongoose, { Document, Schema } from 'mongoose';
import { ICodeFinding } from './Review';

export interface ICodeBattle extends Document {
  userId: string;
  file: string;
  originalCode: string;
  optimizedCode: string;
  originalScore: number;
  optimizedScore: number;
  scoreDelta?: number;
  winner?: 'Original' | 'AI Optimization' | 'Tie';
  complexityOriginal: string;
  complexityOptimized: string;
  originalFindings?: ICodeFinding[];
  optimizedFindings?: ICodeFinding[];
  metrics: {
    security: { original: number; optimized: number };
    performance: { original: number; optimized: number };
    maintainability: { original: number; optimized: number };
  };
  winnerExplanation: string;
  summary?: string;
  changes?: Array<{ category: string; explanation: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const CodeBattleSchema = new Schema<ICodeBattle>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    file: { type: String, required: true },
    originalCode: { type: String, required: true },
    optimizedCode: { type: String, required: true },
    originalScore: { type: Number, required: true },
    optimizedScore: { type: Number, required: true },
    scoreDelta: { type: Number },
    winner: { type: String, enum: ['Original', 'AI Optimization', 'Tie'] },
    complexityOriginal: { type: String, required: true },
    complexityOptimized: { type: String, required: true },
    originalFindings: { type: Array, default: [] },
    optimizedFindings: { type: Array, default: [] },
    metrics: {
      security: {
        original: { type: Number, required: true },
        optimized: { type: Number, required: true },
      },
      performance: {
        original: { type: Number, required: true },
        optimized: { type: Number, required: true },
      },
      maintainability: {
        original: { type: Number, required: true },
        optimized: { type: Number, required: true },
      },
    },
    winnerExplanation: { type: String, required: true },
    summary: { type: String },
    changes: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

export const CodeBattle =
  mongoose.models.CodeBattle ||
  mongoose.model<ICodeBattle>('CodeBattle', CodeBattleSchema);
