import { IEmbeddingProvider } from './embeddingProvider.interface';
import { OpenAIEmbeddingProvider } from './openaiEmbeddingProvider';
import { SemanticFeatureEmbeddingProvider } from './semanticFeatureEmbeddingProvider';

export class EmbeddingService {
  private static providers: IEmbeddingProvider[] = [
    new OpenAIEmbeddingProvider(),
    new SemanticFeatureEmbeddingProvider(),
  ];

  static async generateEmbedding(text: string): Promise<number[]> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.embedText(text);
        } catch (err: any) {
          console.warn(`⚠️ Embedding provider [${provider.name}] failed: ${err.message}. Trying fallback...`);
        }
      }
    }

    const fallback = new SemanticFeatureEmbeddingProvider();
    return await fallback.embedText(text);
  }

  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        try {
          return await provider.embedBatch(texts);
        } catch (err: any) {
          console.warn(`⚠️ Embedding provider [${provider.name}] failed: ${err.message}. Trying fallback...`);
        }
      }
    }

    const fallback = new SemanticFeatureEmbeddingProvider();
    return await fallback.embedBatch(texts);
  }

  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1.0, Math.round(similarity * 1000) / 1000));
  }
}
