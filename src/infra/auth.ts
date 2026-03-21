import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { config } from '@/config'
import { db } from '@/infra/db'
import {
  findByEmail,
  insertMember,
  updateUserId,
} from '@/infra/db/repositories/members-repository'

async function syncMemberFromUser(user: { id: string; name: string; email: string }) {
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

  await insertMember({
    userId: user.id,
    name: user.name,
    username,
    email: user.email,
    active: true,
  })
}

function buildSocialProviders() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } =
    config.betterAuth

  return {
    ...(GOOGLE_CLIENT_ID && {
      google: { clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET },
    }),
    ...(DISCORD_CLIENT_ID && {
      discord: { clientId: DISCORD_CLIENT_ID, clientSecret: DISCORD_CLIENT_SECRET },
    }),
  }
}

export const auth = betterAuth({
  baseURL: config.betterAuth.BETTER_AUTH_URL,
  secret: config.betterAuth.BETTER_AUTH_SECRET,
  trustedOrigins: [config.betterAuth.BETTER_AUTH_URL, config.betterAuth.FRONTEND_URL],
  database: drizzleAdapter(db, { provider: 'pg' }),
  socialProviders: buildSocialProviders(),
  databaseHooks: {
    user: {
      create: {
        after: syncMemberFromUser,
      },
    },
  },
})
