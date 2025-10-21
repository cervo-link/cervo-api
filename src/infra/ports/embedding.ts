import type { Tracer } from '@opentelemetry/api'
import type { DomainError } from '@/domain/errors/domain-error'

export type EmbeddingService = {
  generateEmbedding(
    text: string,
    tracer: Tracer
  ): Promise<number[] | DomainError>
}
