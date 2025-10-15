import scrapingbee from 'scrapingbee'
import { config } from '@/config'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import type { ScrappingService } from '@/infra/ports/scrapping'

export async function scrapping(url: string) {
  const apiKey = config.scrappingBee.SCRAPPING_BEE_API_KEY

  const client = new scrapingbee.ScrapingBeeClient(apiKey ?? '')

  const prompt =
    'Generate a concise but information-rich summary of the following content, mentioning the main topics, technologies, names, or keywords covered. Focus on what the content is about:'

  const response = await client.get({
    url: url,
    params: {
      ai_query: prompt,
      render_js: true,
    },
  })

  if (response.status !== 200) {
    return new FailedToScrap(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.data.toString('utf-8')
}

export const ScrappingBeeAdapter: ScrappingService = {
  scrapping: async (url: string) => scrapping(url),
}
