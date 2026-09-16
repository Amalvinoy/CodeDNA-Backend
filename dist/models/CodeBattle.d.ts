import mongoose, { Document } from 'mongoose';
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
        security: {
            original: number;
            optimized: number;
        };
        performance: {
            original: number;
            optimized: number;
        };
        maintainability: {
            original: number;
            optimized: number;
        };
    };
    winnerExplanation: string;
    summary?: string;
    changes?: Array<{
        category: string;
        explanation: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CodeBattle: mongoose.Model<any, {}, {}, {}, any, any>;
