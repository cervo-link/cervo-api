import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { createMemberFromOAuth } from '@/domain/services/members/create-member-from-oauth-service'
import { db } from '@/infra/db'
import {
  findByEmail,
  updateUserId,
} from '@/infra/db/repositories/members-repository'

function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {}
  const { betterAuth: ba } = config

  if (ba.GOOGLE_CLIENT_ID && ba.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: ba.GOOGLE_CLIENT_ID,
      clientSecret: ba.GOOGLE_CLIENT_SECRET,
    }
  }

  if (ba.DISCORD_CLIENT_ID && ba.DISCORD_CLIENT_SECRET) {
    providers.discord = {
      clientId: ba.DISCORD_CLIENT_ID,
      clientSecret: ba.DISCORD_CLIENT_SECRET,
    }
  }

  if (ba.GITHUB_CLIENT_ID && ba.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: ba.GITHUB_CLIENT_ID,
      clientSecret: ba.GITHUB_CLIENT_SECRET,
    }
  }

  return providers
}

export const auth = betterAuth({
  baseURL: config.betterAuth.BETTER_AUTH_URL,
  secret: config.betterAuth.BETTER_AUTH_SECRET,
  trustedOrigins: ['*'],
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
  socialProviders: buildSocialProviders(),
  databaseHooks: {
    user: {
      create: {
        after: async user => {
          const existing = await findByEmail(user.email)

          if (existing) {
            if (!existing.userId) {
              await updateUserId(existing.id, user.id)
            }
            return
          }

          const username = user.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')

          await createMemberFromOAuth({
            userId: user.id,
            name: user.name,
            username,
            email: user.email,
          })
        },
      },
    },
  },
})
