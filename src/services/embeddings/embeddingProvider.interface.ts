export interface IEmbeddingProvider {
  readonly name: string;
  isAvailable(): boolean;
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
