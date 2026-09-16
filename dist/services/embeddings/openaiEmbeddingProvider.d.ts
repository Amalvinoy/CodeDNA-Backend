import { IEmbeddingProvider } from './embeddingProvider.interface';
export declare class OpenAIEmbeddingProvider implements IEmbeddingProvider {
    readonly name = "OpenAI text-embedding-3-small";
    private apiKey;
    constructor();
    isAvailable(): boolean;
    embedText(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}
