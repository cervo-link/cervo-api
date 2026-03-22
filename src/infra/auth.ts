import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { createMemberFromOAuth } from '@/domain/services/members/create-member-from-oauth-service'
import { db } from '@/infra/db'
import {
  findByEmail,
  updateUserId,
} from '@/infra/db/repositories/members-repository'

const ba = config.betterAuth

export const auth = betterAuth({
  baseURL: ba.BETTER_AUTH_URL,
  secret: ba.BETTER_AUTH_SECRET,
  trustedOrigins: [ba.BETTER_AUTH_URL, ba.FRONTEND_URL],
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
