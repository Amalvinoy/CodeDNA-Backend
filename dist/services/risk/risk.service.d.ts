import { IRiskPrediction } from '../../models';
import { RiskForecastResult } from './risk.interface';
export declare class RiskService {
    static forecastRisk(userId: string, input: {
        language: string;
        fileName: string;
        sourceCode: string;
    }): Promise<RiskForecastResult>;
    static getPredictiveRisk(userId: string): Promise<IRiskPrediction | null>;
}
