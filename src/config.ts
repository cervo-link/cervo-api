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

function getAuthConfig() {
  const schema = z.object({
    API_KEY: z.string().min(1, 'API_KEY is required for authentication'),
  })

  return schema.parse(process.env)
}

export const config = {
  db: getDbConfig(),
  app: getAppConfig(),
  gemma: getGemmaConfig(),
  scrappingBee: getScrappingBeeConfig(),
  embeddingGemma: getEmbeddingGemmaConfig(),
  auth: getAuthConfig(),
}
