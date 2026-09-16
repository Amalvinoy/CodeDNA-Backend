import { IEmbeddingProvider } from './embeddingProvider.interface';
import { env } from '../../config/env';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly name = 'OpenAI text-embedding-3-small';
  private apiKey: string;

  constructor() {
    this.apiKey = env.OPENAI_API_KEY || '';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
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

      const json: any = await response.json();
      return json.data.map((item: any) => item.embedding);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
