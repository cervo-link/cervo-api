import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { db } from '@/infra/db'

export const auth = betterAuth({
  baseURL: config.betterAuth.BETTER_AUTH_URL,
  secret: config.betterAuth.BETTER_AUTH_SECRET,
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
  },
})
