import { request } from 'undici'
import { config } from '@/config'
import type { SummarizeService } from '@/infra/ports/summarize'

export async function summarize(text: string) {
  const url = config.gemma.GEMMA_URL

  const prompt = `You are helping build a smart search system. Summarize the following content in exactly one concise, information-rich sentence, 
  explicitly mentioning the main topics, technologies, names, and keywords present in the text. 
  You must answer ONLY with the summary sentence. If you add any introduction or explanation, your answer will be discarded. Here is the content:`

  const response = await request(`${url}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma:2b',
      prompt: `${prompt} ${text}`,
      stream: false,
    }),
  })

  if (response.statusCode !== 200) {
    const body = (await response.body.json()) as { message: string }
    throw new Error(
      `HTTP ${response.statusCode}: ${body.message || 'Request failed'}`
    )
  }

  const data = (await response.body.json()) as { response: string }

  const lines = data.response
    .split('\n')
    .filter(
      l =>
        l &&
        !l.toLowerCase().includes('sure') &&
        !l.toLowerCase().includes('summary') &&
        !l.toLowerCase().includes('here') &&
        !l.toLowerCase().includes('requested')
    )
  const summary = lines[0].trim()

  return summary
}

export const GemmaAdapter: SummarizeService = {
  summarize: async (text: string) => {
    return summarize(text)
  },
}
