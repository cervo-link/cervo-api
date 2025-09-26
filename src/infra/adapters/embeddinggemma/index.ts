import { config } from '@/config'
import type { EmbeddingService } from '@/infra/ports/embedding'

export async function generateEmbedding(message: string) {
  const url = `${config.embeddingGemma.EMBEDDINGGEMMA_URL}/api/embeddings`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'embeddinggemma:latest',
      input: message,
    }),
  })

  console.log(response)

  return []
}

export const EmbeddingGemmaAdapter: EmbeddingService = {
  generateEmbedding: async (message: string) => generateEmbedding(message),
}
