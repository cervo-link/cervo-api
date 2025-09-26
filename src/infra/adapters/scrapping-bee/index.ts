import scrapingbee from 'scrapingbee'
import { config } from '@/config'
import type { ScrappingService } from '@/infra/ports/scrapping'

export async function scrapping(url: string) {
  const apiKey = config.scrappingBee.SCRAPPING_BEE_API_KEY

  const client = new scrapingbee.ScrapingBeeClient(apiKey)

  const prompt =
    'Make a brief and objective summary of the following content, explaining what it is about:'

  const response = await client.get({
    url: url,
    params: {
      ai_query: prompt,
      render_js: true,
    },
  })

  return response.data.toString('utf-8')
}

export const ScrappingBeeAdapter: ScrappingService = {
  scrapping: async (url: string) => scrapping(url),
}
