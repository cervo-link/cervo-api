import { request } from 'undici'
import { config } from '@/config'
import type { DomainError } from '@/domain/errors/domain-error'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
import type { EmbeddingService } from '@/infra/ports/embedding'

type EmbeddingGemmaResponse = {
  embedding: number[]
}

export async function generateEmbedding(message: string) {
  const url = `${config.embeddingGemma.EMBEDDINGGEMMA_URL}/api/embeddings`

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'embeddinggemma:latest',
      prompt: message,
    }),
  }

  const response = await request(url, options)

  if (response.statusCode !== 200) {
    const body = (await response.body.json()) as { message: string }
    return new FailedToGenerateEmbedding(
      `HTTP ${response.statusCode}: ${body.message || 'Request failed'}`
    )
  }

  const data = (await response.body.json()) as EmbeddingGemmaResponse

  return data.embedding
}

export const EmbeddingGemmaAdapter: EmbeddingService = {
  generateEmbedding: async (message: string): Promise<number[] | DomainError> =>
    generateEmbedding(message),
}
