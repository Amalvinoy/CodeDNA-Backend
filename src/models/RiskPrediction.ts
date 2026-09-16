import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskPrediction extends Document {
  userId: string;
  repository: string;
  prNumber: string;
  lastScanned: string;
  overallCategory: string;
  riskPercent: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  confidencePercent: number;
  primaryFactors: {
    id: string;
    label: string;
    impactPercent: number;
    color: 'red' | 'amber' | 'cyan';
  }[];
  diagnosticReasoning: {
    summary: string;
    affectedClass: string;
    historicalEvidence: {
      occurrences: number;
      sampleReviews: number;
      productionAlerts: number;
      timeframe: string;
    };
    incidentTimeline: {
      id: string;
      pr: string;
      title: string;
      timeAgo: string;
      description: string;
      severity: 'red' | 'amber' | 'green';
    }[];
    targetFile: string;
    targetLines: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RiskPredictionSchema = new Schema<IRiskPrediction>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    repository: { type: String, required: true },
    prNumber: { type: String, required: true },
    lastScanned: { type: String, default: 'Just now' },
    overallCategory: { type: String, required: true },
    riskPercent: { type: Number, required: true },
    riskLevel: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      required: true,
    },
    recommendation: { type: String, required: true },
    confidencePercent: { type: Number, default: 94 },
    primaryFactors: [
      {
        id: { type: String },
        label: { type: String },
        impactPercent: { type: Number },
        color: { type: String, enum: ['red', 'amber', 'cyan'] },
      },
    ],
    diagnosticReasoning: {
      summary: { type: String },
      affectedClass: { type: String },
      historicalEvidence: {
        occurrences: { type: Number },
        sampleReviews: { type: Number },
        productionAlerts: { type: Number },
        timeframe: { type: String },
      },
      incidentTimeline: [
        {
          id: { type: String },
          pr: { type: String },
          title: { type: String },
          timeAgo: { type: String },
          description: { type: String },
          severity: { type: String, enum: ['red', 'amber', 'green'] },
        },
      ],
      targetFile: { type: String },
      targetLines: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

export const RiskPrediction =
  mongoose.models.RiskPrediction ||
  mongoose.model<IRiskPrediction>('RiskPrediction', RiskPredictionSchema);
