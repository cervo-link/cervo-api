import scrapingbee from 'scrapingbee'
import { config } from '@/config'

export async function scrappingBeeAdapter(url: string) {
  const apiKey = config.scrappingBee.SCRAPPING_BEE_API_KEY

  const client = new scrapingbee.ScrapingBeeClient(apiKey)
  const response = await client.get({
    url: url,
    params: {},
  })

  return response
}
