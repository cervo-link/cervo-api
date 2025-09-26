export type EmbeddingService = {
  generateEmbedding(text: string): Promise<number[]>
}
