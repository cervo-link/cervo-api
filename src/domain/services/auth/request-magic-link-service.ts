import { randomBytes } from 'node:crypto'
import { trace } from '@opentelemetry/api'
import { DomainError } from '@/domain/errors/domain-error'
import { insertMagicLinkToken } from '@/infra/db/repositories/magic-link-tokens-repository'
import { findByEmail, insertMember } from '@/infra/db/repositories/members-repository'
import type { EmailService } from '@/infra/ports/email'
import { parseDurationMs } from '@/infra/utils/parse-duration'
import { config } from '@/config'

export async function requestMagicLink(
  email: string,
  emailService: EmailService
): Promise<void> {
  const tracer = trace.getTracer('request-magic-link')

  return tracer.startActiveSpan('request-magic-link-service', async span => {
    let member = await findByEmail(email)

    if (!member) {
      const result = await insertMember({
        email,
        name: email.split('@')[0],
      })
      if (result instanceof DomainError) {
        // Do not reveal whether the email exists
        span.end()
        return
      }
      member = result
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(
      Date.now() + parseDurationMs(config.jwt.MAGIC_LINK_EXPIRES_IN, 15 * 60 * 1000)
    )

    await insertMagicLinkToken({ memberId: member.id, token, expiresAt })

    const link = `${config.jwt.APP_URL}/auth/verify?token=${token}`
    await emailService.sendMagicLink(email, link)

    span.end()
  })
}
