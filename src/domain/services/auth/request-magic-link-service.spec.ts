import { describe, expect, it, vi } from 'vitest'
import { makeMember } from '@/tests/factories/make-member'
import { requestMagicLink } from './request-magic-link-service'

describe('requestMagicLink', () => {
  it('should create a magic link token and send email for existing member', async () => {
    const member = await makeMember()
    const emailService = { sendMagicLink: vi.fn().mockResolvedValue(undefined) }

    await requestMagicLink(member.email as string, emailService)

    expect(emailService.sendMagicLink).toHaveBeenCalledOnce()
    const [to, link] = emailService.sendMagicLink.mock.calls[0]
    expect(to).toBe(member.email)
    expect(link).toContain('/auth/verify?token=')
  })

  it('should auto-register a new member when email is not found', async () => {
    const email = `newuser-${Date.now()}@example.com`
    const emailService = { sendMagicLink: vi.fn().mockResolvedValue(undefined) }

    await requestMagicLink(email, emailService)

    expect(emailService.sendMagicLink).toHaveBeenCalledOnce()
    const [to] = emailService.sendMagicLink.mock.calls[0]
    expect(to).toBe(email)
  })

  it('should not throw when called multiple times for same email', async () => {
    const member = await makeMember()
    const emailService = { sendMagicLink: vi.fn().mockResolvedValue(undefined) }

    await requestMagicLink(member.email as string, emailService)
    await requestMagicLink(member.email as string, emailService)

    expect(emailService.sendMagicLink).toHaveBeenCalledTimes(2)
  })
})
