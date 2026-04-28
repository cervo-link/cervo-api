import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { DomainError } from '@/domain/errors/domain-error'
import { IdentityAlreadyLinked } from '@/domain/errors/identity-already-linked'
import { createMemberFromOAuth } from '@/domain/services/members/create-member-from-oauth-service'
import { linkMemberIdentity } from '@/domain/services/members/link-member-identity-service'
import { betterAuthLogger } from '@/infra/auth-logger'
import { db } from '@/infra/db'
import {
  findByEmail,
  findByUserId,
  updateUserId,
} from '@/infra/db/repositories/members-repository'
import { logger } from '@/infra/logger'

const ba = config.betterAuth

export const auth = betterAuth({
  baseURL: ba.BETTER_AUTH_URL,
  secret: ba.BETTER_AUTH_SECRET,
  trustedOrigins: ['*'],
  logger: betterAuthLogger,
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    ...(ba.GOOGLE_CLIENT_ID &&
      ba.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: ba.GOOGLE_CLIENT_ID,
          clientSecret: ba.GOOGLE_CLIENT_SECRET,
        },
      }),
    ...(ba.DISCORD_CLIENT_ID &&
      ba.DISCORD_CLIENT_SECRET && {
        discord: {
          clientId: ba.DISCORD_CLIENT_ID,
          clientSecret: ba.DISCORD_CLIENT_SECRET,
        },
      }),
    ...(ba.GITHUB_CLIENT_ID &&
      ba.GITHUB_CLIENT_SECRET && {
        github: {
          clientId: ba.GITHUB_CLIENT_ID,
          clientSecret: ba.GITHUB_CLIENT_SECRET,
        },
      }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async user => {
          logger.info(
            { userId: user.id, email: user.email },
            '[auth:hook] user.create.after fired'
          )

          const existing = await findByEmail(user.email)

          if (existing) {
            logger.info(
              { memberId: existing.id, hasUserId: !!existing.userId },
              '[auth:hook] existing member found'
            )
            if (!existing.userId) {
              await updateUserId(existing.id, user.id)
              logger.info(
                { userId: user.id, memberId: existing.id },
                '[auth:hook] linked userId to member'
              )
            }
            return
          }

          const username = user.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')

          logger.info({ username }, '[auth:hook] creating new member')

          const result = await createMemberFromOAuth({
            userId: user.id,
            name: user.name,
            username,
            email: user.email,
          })

          if (result instanceof DomainError) {
            logger.error(
              { message: result.message, status: result.status },
              '[auth:hook] failed to create member'
            )
          } else {
            logger.info({ memberId: result.id }, '[auth:hook] member created')
          }
        },
      },
    },
    account: {
      create: {
        after: async account => {
          const provider = account.providerId
          const providerUserId = account.accountId

          logger.info(
            { userId: account.userId, provider, providerUserId },
            '[auth:hook] account.create.after fired'
          )

          if (!provider || !providerUserId) return

          const realMember = await findByUserId(account.userId)
          if (!realMember) {
            logger.error(
              { userId: account.userId, provider },
              '[auth:hook] no member for account.userId — user.create.after did not run'
            )
            return
          }

          const result = await linkMemberIdentity({
            realMemberId: realMember.id,
            provider,
            providerUserId,
          })

          if (result instanceof IdentityAlreadyLinked) {
            logger.info(
              { memberId: realMember.id, provider },
              '[auth:hook] identity already linked'
            )
            return
          }

          if (result instanceof DomainError) {
            logger.error(
              {
                message: result.message,
                status: result.status,
                memberId: realMember.id,
                provider,
              },
              '[auth:hook] failed to link/merge identity'
            )
            return
          }

          logger.info(
            { memberId: realMember.id, provider, providerUserId },
            '[auth:hook] identity linked (shadow merged if any)'
          )
        },
      },
    },
  },
})
