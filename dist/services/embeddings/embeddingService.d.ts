export declare class EmbeddingService {
    private static providers;
    static generateEmbedding(text: string): Promise<number[]>;
    static generateEmbeddings(texts: string[]): Promise<number[][]>;
    static cosineSimilarity(vecA: number[], vecB: number[]): number;
}
