import { IAIProvider, AIAnalysisRequest, AIAnalysisResult, AIOptimizationRequest, AIOptimizationResult, AIDefenseEvaluationRequest, AIDefenseEvaluationResult } from './aiProvider.interface';
export declare class AIService {
    private static geminiProvider;
    private static openAIProvider;
    private static fallbackProvider;
    private static testProvider;
    static setTestProvider(provider: IAIProvider | null): void;
    /**
     * Resolves configured primary provider based on env.AI_PROVIDER.
     * Default: Gemini.
     * If AI_PROVIDER=openai is explicitly configured, uses OpenAI.
     * If Gemini is unavailable or fails, routes to IntelligentFallbackProvider.
     * Does NOT silently switch back to OpenAI unless explicitly configured.
     */
    static getPrimaryProvider(): IAIProvider;
    static analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
    static optimize(request: AIOptimizationRequest): Promise<AIOptimizationResult>;
    static evaluateDefense(request: AIDefenseEvaluationRequest): Promise<AIDefenseEvaluationResult>;
}
