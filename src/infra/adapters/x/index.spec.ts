import { afterEach, describe, expect, it, vi } from 'vitest'
import { FailedToScrap } from '@/domain/errors/failed-to-scrap'
import { isXUrl, scrapeXPost } from '.'

describe('isXUrl', () => {
  it('should return true for x.com URLs', () => {
    expect(isXUrl('https://x.com/user/status/123')).toBe(true)
  })

  it('should return true for www.x.com URLs', () => {
    expect(isXUrl('https://www.x.com/user/status/123')).toBe(true)
  })

  it('should return true for twitter.com URLs', () => {
    expect(isXUrl('https://twitter.com/user/status/123')).toBe(true)
  })

  it('should return true for www.twitter.com URLs', () => {
    expect(isXUrl('https://www.twitter.com/user/status/123')).toBe(true)
  })

  it('should return false for other URLs', () => {
    expect(isXUrl('https://www.google.com')).toBe(false)
    expect(isXUrl('https://github.com')).toBe(false)
  })

  it('should return false for invalid URLs', () => {
    expect(isXUrl('not-a-url')).toBe(false)
  })
})

describe('scrapeXPost', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return tweet text with author when oEmbed succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          author_name: 'John Doe',
          html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Hello world, check out <a href="#">this link</a>!</p>&mdash; John Doe (@johndoe) <a href="#">date</a></blockquote>',
        }),
      })
    )

    const result = await scrapeXPost('https://x.com/johndoe/status/123')

    expect(result).toBe('by John Doe: Hello world, check out this link!')
  })

  it('should decode HTML entities in tweet text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          author_name: 'Author',
          html: '<blockquote><p lang="en">A &amp; B &lt;tag&gt; &quot;quoted&quot; &#39;apostrophe&#39;</p></blockquote>',
        }),
      })
    )

    const result = await scrapeXPost('https://x.com/author/status/456')

    expect(result).toBe(`by Author: A & B <tag> "quoted" 'apostrophe'`)
  })

  it('should return FailedToScrap when HTTP request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    )

    const result = await scrapeXPost('https://x.com/user/status/999')

    expect(result).toBeInstanceOf(FailedToScrap)
  })

  it('should return FailedToScrap when oEmbed returns no HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ author_name: 'Author' }),
      })
    )

    const result = await scrapeXPost('https://x.com/user/status/123')

    expect(result).toBeInstanceOf(FailedToScrap)
  })

  it('should return FailedToScrap when no <p> tag is found in HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          author_name: 'Author',
          html: '<blockquote>no paragraph here</blockquote>',
        }),
      })
    )

    const result = await scrapeXPost('https://x.com/user/status/123')

    expect(result).toBeInstanceOf(FailedToScrap)
  })
})
