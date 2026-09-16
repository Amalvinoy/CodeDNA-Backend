import {
  IAIProvider,
  AIAnalysisRequest,
  AIAnalysisResult,
  AIOptimizationRequest,
  AIOptimizationResult,
  AIDefenseEvaluationRequest,
  AIDefenseEvaluationResult,
} from './aiProvider.interface';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { IntelligentFallbackProvider } from './intelligentFallbackProvider';
import { env } from '../../config/env';

export class AIService {
  private static geminiProvider = new GeminiProvider();
  private static openAIProvider = new OpenAIProvider();
  private static fallbackProvider = new IntelligentFallbackProvider();
  private static testProvider: IAIProvider | null = null;

  static setTestProvider(provider: IAIProvider | null) {
    this.testProvider = provider;
  }

  /**
   * Resolves configured primary provider based on env.AI_PROVIDER.
   * Default: Gemini.
   * If AI_PROVIDER=openai is explicitly configured, uses OpenAI.
   * If Gemini is unavailable or fails, routes to IntelligentFallbackProvider.
   * Does NOT silently switch back to OpenAI unless explicitly configured.
   */
  static getPrimaryProvider(): IAIProvider {
    if (this.testProvider && this.testProvider.isAvailable()) {
      return this.testProvider;
    }
    const providerType = (env.AI_PROVIDER || 'gemini').toLowerCase();
    if (providerType === 'openai') {
      return this.openAIProvider;
    }
    if (providerType === 'fallback') {
      return this.fallbackProvider;
    }
    return this.geminiProvider;
  }

  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    if (this.testProvider && this.testProvider.isAvailable()) {
      try {
        return await this.testProvider.analyzeCode(request);
      } catch (error: any) {
        console.warn(`⚠️ Test provider [${this.testProvider.name}] failed: ${error.message}. Routing to deterministic fallback provider...`);
      }
    }

    const primary = this.getPrimaryProvider();
    if (primary.isAvailable()) {
      try {
        const result = await primary.analyzeCode(request);
        return result;
      } catch (error: any) {
        console.warn(`⚠️ Provider [${primary.name}] failed: ${error.message}. Routing to deterministic fallback provider...`);
      }
    }

    // Guaranteed heuristic fallback for code review static-analysis augmentation
    return await this.fallbackProvider.analyzeCode(request);
  }

  static async optimize(request: AIOptimizationRequest): Promise<AIOptimizationResult> {
    if (this.testProvider && this.testProvider.isAvailable() && this.testProvider.optimizeCode) {
      try {
        return await this.testProvider.optimizeCode(request);
      } catch (error: any) {
        console.warn(`⚠️ Test provider [${this.testProvider.name}] optimization failed: ${error.message}`);
      }
    }

    const primary = this.getPrimaryProvider();
    if (primary.isAvailable() && primary.optimizeCode) {
      try {
        const result = await primary.optimizeCode(request);
        return result;
      } catch (error: any) {
        console.warn(`⚠️ Provider [${primary.name}] optimization failed: ${error.message}`);
      }
    }

    // If AI provider is unavailable or fails: Do NOT return fake optimized code!
    throw new Error('AI optimization unavailable.');
  }

  static async evaluateDefense(
    request: AIDefenseEvaluationRequest
  ): Promise<AIDefenseEvaluationResult> {
    if (this.testProvider && this.testProvider.isAvailable() && this.testProvider.evaluateDefense) {
      return await this.testProvider.evaluateDefense(request);
    }

    const primary = this.getPrimaryProvider();
    if (primary.isAvailable() && primary.evaluateDefense) {
      try {
        return await primary.evaluateDefense(request);
      } catch (error: any) {
        console.warn(`⚠️ Provider [${primary.name}] defense evaluation failed: ${error.message}`);
      }
    }

    // Deterministic rule-based evaluation of defense arguments if live LLM is not configured
    const reasoning = (request.defenseReasoning || '').toLowerCase();
    let score = 50;
    const insights: string[] = [];

    if (reasoning.includes('memory') || reasoning.includes('allocation') || reasoning.includes('heap') || reasoning.includes('gc')) {
      score += 15;
      insights.push('valid memory footprint and allocation considerations');
    }
    if (reasoning.includes('latency') || reasoning.includes('cache') || reasoning.includes('throughput') || reasoning.includes('concurrency')) {
      score += 15;
      insights.push('runtime performance trade-offs under high concurrency');
    }
    if (reasoning.includes('simplicity') || reasoning.includes('readability') || reasoning.includes('maintenance')) {
      score += 10;
      insights.push('engineering ergonomics and code maintainability');
    }

    const evaluation = insights.length > 0
      ? `Architectural defense assessed: Highlighted ${insights.join(', ')}. While valid for specialized constraints, AI optimization balances comprehensive security, strong typing, and boundary protections.`
      : 'Architectural defense recorded. Rationale focuses on baseline ergonomics, though candidate refactoring exhibits higher resilience across edge cases.';

    return {
      evaluation,
      pointsAwarded: Math.min(100, score),
    };
  }
}
