import { z } from 'zod'

function getDbConfig() {
  const schema = z.object({
    DATABASE_URL: z.url(),
  })

  return schema.parse(process.env)
}

function getAppConfig() {
  const schema = z.object({
    PORT: z.string().default('8080'),
    NODE_ENV: z.enum(['dev', 'production', 'test']).default('test'),
  })

  return schema.parse(process.env)
}

function getGemmaConfig() {
  const schema = z.object({
    GEMMA_URL: z.url().optional(),
  })

  return schema.parse(process.env)
}
function getScrappingBeeConfig() {
  const schema = z.object({
    SCRAPPING_BEE_API_KEY: z.string().optional(),
  })

  return schema.parse(process.env)
}
function getEmbeddingGemmaConfig() {
  const schema = z.object({
    EMBEDDINGGEMMA_URL: z.url().optional(),
  })

  return schema.parse(process.env)
}

function getXConfig() {
  const schema = z.object({
    X_OEMBED_URL: z.url().default('https://publish.twitter.com/oembed'),
  })

  return schema.parse(process.env)
}

function getAuthConfig() {
  const schema = z.object({
    API_KEY: z.string().min(1, 'API_KEY is required for authentication'),
  })

  return schema.parse(process.env)
}

function getJwtConfig() {
  const schema = z.object({
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    MAGIC_LINK_EXPIRES_IN: z.string().default('15m'),
    APP_URL: z.string().default('http://localhost:3000'),
  })

  return schema.parse(process.env)
}

function getSmtpConfig() {
  const schema = z.object({
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().default('noreply@cervo.app'),
  })

  return schema.parse(process.env)
}

export const config = {
  db: getDbConfig(),
  app: getAppConfig(),
  gemma: getGemmaConfig(),
  scrappingBee: getScrappingBeeConfig(),
  embeddingGemma: getEmbeddingGemmaConfig(),
  x: getXConfig(),
  auth: getAuthConfig(),
  jwt: getJwtConfig(),
  smtp: getSmtpConfig(),
}
