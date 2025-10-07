import { GemmaAdapter } from '@/infra/adapters/gemma'
import type { SummarizeService } from '../ports/summarize'

type SummarizeServiceProvider = 'gemma'

export function createSummarizeService(
  provider: SummarizeServiceProvider
): SummarizeService {
  switch (provider) {
    case 'gemma':
      return GemmaAdapter

    default:
      throw new Error(`Unsupported summarize service provider: ${provider}`)
  }
}
