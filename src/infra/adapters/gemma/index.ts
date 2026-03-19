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

export async function generateTags(
  text: string
): Promise<string[] | FailedToSummarize> {
  const url = config.gemma.GEMMA_URL

  const prompt = `Generate 3 to 5 short tags for the following content. Reply with ONLY a comma-separated list of lowercase tags, no explanation:`

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
    return new FailedToSummarize('Failed to generate tags')
  }

  const data = (await response.body.json()) as { response: string }
  const tags = data.response
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
    .slice(0, 5)

  return tags.length > 0 ? tags : new FailedToSummarize('Empty tags response')
}

export async function explain(
  query: string,
  summaries: string[]
): Promise<string[] | FailedToSummarize> {
  const url = config.gemma.GEMMA_URL

  const numbered = summaries
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n')

  const prompt = `Given the search query "${query}", explain in one sentence why each of the following summaries is relevant. Reply with ONLY a numbered list matching the input order, no extra text:\n${numbered}`

  const response = await request(`${url}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma:2b',
      prompt,
      stream: false,
    }),
  })

  if (response.statusCode !== 200) {
    return new FailedToSummarize('Failed to generate explanations')
  }

  const data = (await response.body.json()) as { response: string }
  const lines = data.response
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0)

  return lines.length > 0 ? lines : new FailedToSummarize('Empty explanation response')
}

export const GemmaAdapter: SummarizeService = {
  summarize: async (text: string, tracer: Tracer) => {
    return tracer.startActiveSpan('summarize-gemma-service', async span => {
      const summary = await summarize(text)
      span.end()
      return summary
    })
  },
  generateTitle: async (text: string, tracer: Tracer) => {
    return tracer.startActiveSpan('generate-title-gemma-service', async span => {
      const title = await generateTitle(text)
      span.end()
      return title
    })
  },
  generateTags: async (text: string, tracer: Tracer) => {
    return tracer.startActiveSpan('generate-tags-gemma-service', async span => {
      const tags = await generateTags(text)
      span.end()
      return tags
    })
  },
  explain: async (query: string, summaries: string[], tracer: Tracer) => {
    return tracer.startActiveSpan('explain-gemma-service', async span => {
      const explanations = await explain(query, summaries)
      span.end()
      return explanations
    })
  },
}
