import { IEmbeddingProvider } from './embeddingProvider.interface';
export declare class SemanticFeatureEmbeddingProvider implements IEmbeddingProvider {
    readonly name = "CodeDNA Deterministic Semantic Vectorizer";
    private static readonly VECTOR_DIMENSION;
    private static readonly CONCEPT_CLUSTERS;
    isAvailable(): boolean;
    embedText(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    private generateVector;
}
