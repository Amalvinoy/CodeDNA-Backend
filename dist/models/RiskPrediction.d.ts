import mongoose, { Document } from 'mongoose';
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
export declare const RiskPrediction: mongoose.Model<any, {}, {}, {}, any, any>;
