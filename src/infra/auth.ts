import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { createMemberFromOAuth } from '@/domain/services/members/create-member-from-oauth-service'
import { db } from '@/infra/db'
import {
  findByEmail,
  updateUserId,
} from '@/infra/db/repositories/members-repository'

export const auth = betterAuth({
  baseURL: config.betterAuth.BETTER_AUTH_URL,
  secret: config.betterAuth.BETTER_AUTH_SECRET,
  trustedOrigins: [
    config.betterAuth.BETTER_AUTH_URL,
    config.betterAuth.FRONTEND_URL,
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      clientId: config.betterAuth.GOOGLE_CLIENT_ID,
      clientSecret: config.betterAuth.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId: config.betterAuth.DISCORD_CLIENT_ID,
      clientSecret: config.betterAuth.DISCORD_CLIENT_SECRET,
    },
    github: {
      clientId: config.betterAuth.GITHUB_CLIENT_ID,
      clientSecret: config.betterAuth.GITHUB_CLIENT_SECRET,
    },
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
