import { ScrappingBeeAdapter } from '@/infra/adapters/scrapping-bee'
import type { ScrappingService } from '../ports/scrapping'

type ScrappingServiceProvider = 'scrapping-bee'

export function createScrappingService(
  provider: ScrappingServiceProvider
): ScrappingService {
  switch (provider) {
    case 'scrapping-bee':
      return ScrappingBeeAdapter

    default:
      throw new Error(`Unsupported scrapping service provider: ${provider}`)
  }
}
