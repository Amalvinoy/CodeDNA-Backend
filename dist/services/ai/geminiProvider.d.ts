import { IAIProvider, AIAnalysisRequest, AIAnalysisResult, AIOptimizationRequest, AIOptimizationResult, AIDefenseEvaluationRequest, AIDefenseEvaluationResult } from './aiProvider.interface';
export declare class GeminiProvider implements IAIProvider {
    readonly name = "Google Gemini";
    private apiKey;
    private model;
    constructor();
    isAvailable(): boolean;
    getModel(): string;
    private cleanJsonOutput;
    private sanitizeErrorMessage;
    private normalizeReviewOutput;
    private normalizeOptimizationOutput;
    analyzeCode(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
    optimizeCode(request: AIOptimizationRequest): Promise<AIOptimizationResult>;
    evaluateDefense(request: AIDefenseEvaluationRequest): Promise<AIDefenseEvaluationResult>;
}
