import { z } from 'zod'

export const requestMagicLinkBodySchema = z.object({
  email: z.email(),
})

export const verifyMagicLinkBodySchema = z.object({
  token: z.string().min(1),
})

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
})

const memberResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  active: z.boolean(),
})

export const requestMagicLinkResponseSchema = {
  200: z.object({ message: z.string() }),
}

export const verifyMagicLinkResponseSchema = {
  200: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    member: memberResponseSchema,
  }),
}

export const refreshTokenResponseSchema = {
  200: z.object({ accessToken: z.string() }),
}

export const logoutResponseSchema = {
  200: z.object({ message: z.string() }),
}
