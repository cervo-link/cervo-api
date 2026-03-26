import { OpenAIEmbeddingAdapter } from '@/infra/adapters/openai'
import { EmbeddingGemmaAdapter } from '@/infra/adapters/embeddinggemma'
import type { EmbeddingService } from '../ports/embedding'

type EmbeddingsProviders = 'embeddinggemma' | 'openai'

export function createEmbeddingProvider(
  provider: EmbeddingsProviders
): EmbeddingService {
  switch (provider) {
    case 'embeddinggemma':
      return EmbeddingGemmaAdapter
    case 'openai':
      return OpenAIEmbeddingAdapter

    default:
      throw new Error(`Unsupported embedding service provider: ${provider}`)
  }
}
