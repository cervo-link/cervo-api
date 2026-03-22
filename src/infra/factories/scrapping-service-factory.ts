import { FirecrawlAdapter } from '@/infra/adapters/firecrawl'
import { ScrappingBeeAdapter } from '@/infra/adapters/scrapping-bee'
import type { ScrappingService } from '../ports/scrapping'

type ScrappingServiceProvider = 'scrapping-bee' | 'firecrawl'

export function createScrappingService(
  provider: ScrappingServiceProvider
): ScrappingService {
  switch (provider) {
    case 'scrapping-bee':
      return ScrappingBeeAdapter
    case 'firecrawl':
      return FirecrawlAdapter

    default:
      throw new Error(`Unsupported scrapping service provider: ${provider}`)
  }
}
