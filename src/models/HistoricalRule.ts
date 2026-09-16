import mongoose, { Document, Schema } from 'mongoose';

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

const HistoricalRuleMetadataSchema = new Schema<IHistoricalRuleMetadata>(
  {
    source: { type: String, default: 'Engineering CSV Knowledge Base' },
    category: { type: String, default: 'General' },
    matchPercent: { type: Number, default: 95 },
    occurrenceCount: { type: Number, default: 1 },
    learnedFrom: { type: String, default: 'Production Review Intelligence' },
    lastEnforced: { type: String, default: 'Recently' },
    preventionRate: { type: Number, default: 98 },
    tags: [{ type: String }],
  },
  { _id: false }
);

const HistoricalRuleSchema = new Schema<IHistoricalRule>(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedDescription: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: HistoricalRuleMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Text search index
HistoricalRuleSchema.index({ normalizedDescription: 'text' });

export const HistoricalRule =
  mongoose.models.HistoricalRule ||
  mongoose.model<IHistoricalRule>('HistoricalRule', HistoricalRuleSchema);
