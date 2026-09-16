"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const openaiEmbeddingProvider_1 = require("./openaiEmbeddingProvider");
const semanticFeatureEmbeddingProvider_1 = require("./semanticFeatureEmbeddingProvider");
class EmbeddingService {
    static providers = [
        new openaiEmbeddingProvider_1.OpenAIEmbeddingProvider(),
        new semanticFeatureEmbeddingProvider_1.SemanticFeatureEmbeddingProvider(),
    ];
    static async generateEmbedding(text) {
        for (const provider of this.providers) {
            if (provider.isAvailable()) {
                try {
                    return await provider.embedText(text);
                }
                catch (err) {
                    console.warn(`⚠️ Embedding provider [${provider.name}] failed: ${err.message}. Trying fallback...`);
                }
            }
        }
        const fallback = new semanticFeatureEmbeddingProvider_1.SemanticFeatureEmbeddingProvider();
        return await fallback.embedText(text);
    }
    static async generateEmbeddings(texts) {
        for (const provider of this.providers) {
            if (provider.isAvailable()) {
                try {
                    return await provider.embedBatch(texts);
                }
                catch (err) {
                    console.warn(`⚠️ Embedding provider [${provider.name}] failed: ${err.message}. Trying fallback...`);
                }
            }
        }
        const fallback = new semanticFeatureEmbeddingProvider_1.SemanticFeatureEmbeddingProvider();
        return await fallback.embedBatch(texts);
    }
    static cosineSimilarity(vecA, vecB) {
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
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=embeddingService.js.map