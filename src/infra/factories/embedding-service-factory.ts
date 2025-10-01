import { EmbeddingGemmaAdapter } from '@/infra/adapters/embeddinggemma'
import type { EmbeddingService } from '../ports/embedding'

type EmbeddingsProviders = 'embeddinggemma'

export function createEmbeddingProvider(
  provider: EmbeddingsProviders
): EmbeddingService {
  switch (provider) {
    case 'embeddinggemma':
      return EmbeddingGemmaAdapter

    default:
      throw new Error(`Unsupported embedding service provider: ${provider}`)
  }
}
