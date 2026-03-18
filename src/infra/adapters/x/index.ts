import { config } from '@/config'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'

const X_HOSTS = ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com']

export function isXUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return X_HOSTS.includes(hostname)
  } catch {
    return false
  }
}

export async function scrapeXPost(
  url: string
): Promise<string | FailedToScrap> {
  const baseUrl = config.x.X_OEMBED_URL
  const endpoint = `${baseUrl}?url=${encodeURIComponent(url)}&omit_script=true`

  const response = await fetch(endpoint)

  if (!response.ok) {
    return new FailedToScrap(
      `X oEmbed HTTP ${response.status}: ${response.statusText}`
    )
  }

  const data = (await response.json()) as {
    html?: string
    author_name?: string
  }

  if (!data.html) {
    return new FailedToScrap('X oEmbed returned no HTML content')
  }

  const text = extractTextFromOEmbedHtml(data.html)

  if (!text) {
    return new FailedToScrap('Could not extract text from X oEmbed response')
  }

  const author = data.author_name ? `by ${data.author_name}: ` : ''
  return `${author}${text}`
}

function extractTextFromOEmbedHtml(html: string): string {
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  if (!pMatch) return ''

  return pMatch[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .trim()
}
