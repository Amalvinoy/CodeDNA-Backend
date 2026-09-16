import { IAIProvider, AIAnalysisRequest, AIAnalysisResult, AIOptimizationRequest, AIOptimizationResult, AIDefenseEvaluationRequest, AIDefenseEvaluationResult } from './aiProvider.interface';
export declare class OpenAIProvider implements IAIProvider {
    readonly name = "OpenAI";
    private apiKey;
    private model;
    constructor();
    isAvailable(): boolean;
    analyzeCode(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
    optimizeCode(request: AIOptimizationRequest): Promise<AIOptimizationResult>;
    evaluateDefense(request: AIDefenseEvaluationRequest): Promise<AIDefenseEvaluationResult>;
}
