import { RiskForecastRequest, RiskForecastResult } from './risk.interface';
export declare class RiskCalculator {
    static calculateRisk(request: RiskForecastRequest): RiskForecastResult;
}
