"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = void 0;
const env_1 = require("../../config/env");
class OpenAIEmbeddingProvider {
    name = 'OpenAI text-embedding-3-small';
    apiKey;
    constructor() {
        this.apiKey = env_1.env.OPENAI_API_KEY || '';
    }
    isAvailable() {
        return Boolean(this.apiKey && this.apiKey.trim().length > 5);
    }
    async embedText(text) {
        const results = await this.embedBatch([text]);
        return results[0];
    }
    async embedBatch(texts) {
        if (!this.isAvailable()) {
            throw new Error('OpenAI API key is not configured.');
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'text-embedding-3-small',
                    input: texts,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI Embedding API error (${response.status}): ${errorText}`);
            }
            const json = await response.json();
            return json.data.map((item) => item.embedding);
        }
        catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
//# sourceMappingURL=openaiEmbeddingProvider.js.map