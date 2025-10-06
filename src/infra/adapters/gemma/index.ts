import { request } from 'undici'
import { config } from '@/config'
import type { SummarizeService } from '@/infra/ports/summarize'

export async function summarize(text: string) {
  const url = config.gemma.GEMMA_URL

  const prompt = `You are helping build a smart search system. Summarize the following content in exactly one concise, information-rich sentence, explicitly mentioning the main topics, technologies, 
    names, and keywords present in the text. The goal is to maximize the semantic richness and clarity of the sentence, 
    making it highly suitable for vector-based search and retrieval. Focus on what the content is about and avoid generic or vague summaries:`

  const response = await request(`${url}/api/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma:2b',
      prompt: `${prompt} ${text}`,
    }),
  })

  if (response.statusCode !== 200) {
    const body = (await response.body.json()) as { message: string }
    throw new Error(
      `HTTP ${response.statusCode}: ${body.message || 'Request failed'}`
    )
  }

  const data = (await response.body.json()) as { summary: string }

  return data.summary
}

export const GemmaAdapter: SummarizeService = {
  summarize: async (text: string) => {
    return summarize(text)
  },
}
