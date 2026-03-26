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

function getFirecrawlConfig() {
  const schema = z.object({
    FIRECRAWL_API_KEY: z.string().optional(),
    FIRECRAWL_URL: z.url().optional(),
    SCRAPPING_PROVIDER: z.enum(['scrapping-bee', 'firecrawl']).default('scrapping-bee'),
  })

  return schema.parse(process.env)
}

function getOpenAIConfig() {
  const schema = z.object({
    OPENAI_API_KEY: z.string().optional(),
    EMBEDDING_PROVIDER: z.enum(['embeddinggemma', 'openai']).default('embeddinggemma'),
    SUMMARIZE_PROVIDER: z.enum(['gemma', 'openai']).default('gemma'),
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

function loadTelemetryEnvs() {
  const schema = z.object({
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  })
  return schema.parse(process.env)
}

function getBetterAuthConfig() {
  const schema = z.object({
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    BETTER_AUTH_URL: z.string().default('http://localhost:8080'),
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
  })

  return schema.parse(process.env)
}

export const config = {
  db: getDbConfig(),
  app: getAppConfig(),
  gemma: getGemmaConfig(),
  scrappingBee: getScrappingBeeConfig(),
  firecrawl: getFirecrawlConfig(),
  embeddingGemma: getEmbeddingGemmaConfig(),
  openai: getOpenAIConfig(),
  x: getXConfig(),
  auth: getAuthConfig(),
  betterAuth: getBetterAuthConfig(),
  telemetry: loadTelemetryEnvs(),
}
