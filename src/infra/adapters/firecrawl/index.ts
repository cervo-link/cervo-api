import FirecrawlApp from '@mendable/firecrawl-js'
import type { Tracer } from '@opentelemetry/api'
import { config } from '@/config'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import { isXUrl, scrapeXPost } from '@/infra/adapters/x'
import type { ScrappingService } from '@/infra/ports/scrapping'

async function scrapping(url: string) {
  if (isXUrl(url)) {
    return scrapeXPost(url)
  }

  const client = new FirecrawlApp({
    apiKey: config.firecrawl.FIRECRAWL_API_KEY ?? '',
    apiUrl: config.firecrawl.FIRECRAWL_URL,
  })

  try {
    const response = await client.scrape(url, { formats: ['markdown'] })
    return response.markdown ?? ''
  } catch (error) {
    return new FailedToScrap(`Firecrawl error: ${error as string}`)
  }
}

export const FirecrawlAdapter: ScrappingService = {
  scrapping: async (url: string, tracer: Tracer) =>
    tracer.startActiveSpan('firecrawl-service', async span => {
      const response = await scrapping(url)
      span.end()
      return response
    }),
}
