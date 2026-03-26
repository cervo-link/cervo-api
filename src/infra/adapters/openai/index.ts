import type { Tracer } from '@opentelemetry/api'
import OpenAI from 'openai'
import { config } from '@/config'
import { FailedToGenerateEmbedding } from '@/domain/errors/failed-to-generate-embedding'
import { FailedToSummarize } from '@/domain/errors/failed-to-summarize'
import type { EmbeddingService } from '@/infra/ports/embedding'
import type { SummarizeService } from '@/infra/ports/summarize'

function getClient() {
  return new OpenAI({ apiKey: config.openai.OPENAI_API_KEY })
}

// Embedding

async function generateEmbedding(text: string) {
  const client = getClient()
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    return new FailedToGenerateEmbedding(`OpenAI embedding error: ${error}`)
  }
}

export const OpenAIEmbeddingAdapter: EmbeddingService = {
  generateEmbedding: async (text: string, tracer: Tracer) =>
    tracer.startActiveSpan('openai-embedding', async span => {
      const result = await generateEmbedding(text)
      span.end()
      return result
    }),
}

// Summarize

async function summarize(text: string) {
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are helping build a smart search system. Summarize the following content in exactly one concise, information-rich sentence, explicitly mentioning the main topics, technologies, names, and keywords present in the text. Reply with ONLY the summary sentence.',
        },
        { role: 'user', content: text },
      ],
      max_tokens: 200,
    })
    const summary = completion.choices[0].message.content?.trim()
    if (!summary) return new FailedToSummarize('Empty summary response')
    return summary
  } catch (error) {
    return new FailedToSummarize(`OpenAI summarize error: ${error}`)
  }
}

async function generateTitle(text: string) {
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Generate a short title (max 10 words) for the following content. Reply with ONLY the title, no quotes or explanation.',
        },
        { role: 'user', content: text.slice(0, 2000) },
      ],
      max_tokens: 30,
    })
    const title = completion.choices[0].message.content?.trim()
    if (!title) return new FailedToSummarize('Empty title response')
    return title
  } catch (error) {
    return new FailedToSummarize(`OpenAI title error: ${error}`)
  }
}

async function generateTags(text: string) {
  const client = getClient()
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Generate 3 to 5 short tags for the following content. Reply with ONLY a comma-separated list of lowercase tags, no explanation.',
        },
        { role: 'user', content: text.slice(0, 2000) },
      ],
      max_tokens: 50,
    })
    const raw = completion.choices[0].message.content?.trim()
    if (!raw) return new FailedToSummarize('Empty tags response')
    const tags = raw
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0)
      .slice(0, 5)
    return tags.length > 0 ? tags : new FailedToSummarize('Empty tags response')
  } catch (error) {
    return new FailedToSummarize(`OpenAI tags error: ${error}`)
  }
}

async function explain(query: string, summaries: string[]) {
  const client = getClient()
  const numbered = summaries.map((s, i) => `${i + 1}. ${s}`).join('\n')
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Given the search query "${query}", explain in one sentence why each of the following summaries is relevant. Reply with ONLY a numbered list matching the input order, no extra text:\n${numbered}`,
        },
      ],
      max_tokens: 300,
    })
    const raw = completion.choices[0].message.content?.trim()
    if (!raw) return new FailedToSummarize('Empty explanation response')
    const lines = raw
      .split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 0)
    return lines.length > 0
      ? lines
      : new FailedToSummarize('Empty explanation response')
  } catch (error) {
    return new FailedToSummarize(`OpenAI explain error: ${error}`)
  }
}

export const OpenAISummarizeAdapter: SummarizeService = {
  summarize: async (text: string, tracer: Tracer) =>
    tracer.startActiveSpan('openai-summarize', async span => {
      const result = await summarize(text)
      span.end()
      return result
    }),
  generateTitle: async (text: string, tracer: Tracer) =>
    tracer.startActiveSpan('openai-generate-title', async span => {
      const result = await generateTitle(text)
      span.end()
      return result
    }),
  generateTags: async (text: string, tracer: Tracer) =>
    tracer.startActiveSpan('openai-generate-tags', async span => {
      const result = await generateTags(text)
      span.end()
      return result
    }),
  explain: async (query: string, summaries: string[], tracer: Tracer) =>
    tracer.startActiveSpan('openai-explain', async span => {
      const result = await explain(query, summaries)
      span.end()
      return result
    }),
}
