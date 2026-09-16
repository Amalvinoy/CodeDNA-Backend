import { IAIProvider, AIAnalysisRequest, AIAnalysisResult } from './aiProvider.interface';
export declare class IntelligentFallbackProvider implements IAIProvider {
    readonly name = "CodeDNA Grounded Semantic Heuristic Engine";
    isAvailable(): boolean;
    analyzeCode(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
    optimizeCode(): Promise<never>;
}
