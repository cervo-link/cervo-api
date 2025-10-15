import type { DomainError } from '@/domain/errors/domain-error'

export type EmbeddingService = {
  generateEmbedding(text: string): Promise<number[] | DomainError>
}
