import type { Tracer } from '@opentelemetry/api'
import { request } from 'undici'
import { config } from '@/config'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import type { SummarizeService } from '@/infra/ports/summarize'

export async function summarize(
  text: string
): Promise<string | FailedToSummarize> {
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
    return new FailedToSummarize(
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

export async function generateTitle(
  text: string
): Promise<string | FailedToSummarize> {
  const url = config.gemma.GEMMA_URL

  const prompt = `Generate a short title (max 10 words) for the following content. Reply with ONLY the title, no quotes or explanation:`

  const response = await request(`${url}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemma:2b',
      prompt: `${prompt} ${text.slice(0, 2000)}`,
      stream: false,
    }),
  })

  if (response.statusCode !== 200) {
    const body = (await response.body.json()) as { message: string }
    return new FailedToSummarize(
      `HTTP ${response.statusCode}: ${body.message || 'Request failed'}`
    )
  }

  const data = (await response.body.json()) as { response: string }
  const title = data.response.split('\n')[0].trim()

  return title || new FailedToSummarize('Empty title response')
}

export const GemmaAdapter: SummarizeService = {
  summarize: async (
    text: string,
    tracer: Tracer
  ): Promise<string | FailedToSummarize> => {
    return tracer.startActiveSpan('summarize-gemma-service', async span => {
      const summary = await summarize(text)
      span.end()
      return summary
    })
  },
  generateTitle: async (
    text: string,
    tracer: Tracer
  ): Promise<string | FailedToSummarize> => {
    return tracer.startActiveSpan('generate-title-gemma-service', async span => {
      const title = await generateTitle(text)
      span.end()
      return title
    })
  },
}
