import { OpenAISummarizeAdapter } from '@/infra/adapters/openai'
import { GemmaAdapter } from '@/infra/adapters/gemma'
import type { SummarizeService } from '../ports/summarize'

type SummarizeServiceProvider = 'gemma' | 'openai'

export function createSummarizeService(
  provider: SummarizeServiceProvider
): SummarizeService {
  switch (provider) {
    case 'gemma':
      return GemmaAdapter
    case 'openai':
      return OpenAISummarizeAdapter

    default:
      throw new Error(`Unsupported summarize service provider: ${provider}`)
  }
}
