import { IRiskPrediction } from '../models';
export declare class RiskService {
    static getPredictiveRisk(userId: string): Promise<IRiskPrediction | null>;
}
