import mongoose, { Document } from 'mongoose';
export interface IHistoricalRuleMetadata {
    source?: string;
    category?: string;
    matchPercent?: number;
    occurrenceCount?: number;
    learnedFrom?: string;
    lastEnforced?: string;
    preventionRate?: number;
    tags?: string[];
}
export interface IHistoricalRule extends Document {
    externalId: string;
    type: string;
    description: string;
    normalizedDescription: string;
    embedding: number[];
    metadata: IHistoricalRuleMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HistoricalRule: mongoose.Model<any, {}, {}, {}, any, any>;
