import { z } from 'zod'

function getDbConfig() {
  const schema = z.object({
    DATABASE_URL: z.string().url(),
  })

  return schema.parse(process.env)
}

function getAppConfig() {
  const schema = z.object({
    PORT: z.string(),
    ENV: z.enum(['development', 'production', 'test']),
  })

  return schema.parse(process.env)
}

function getScrappingBeeConfig() {
  const schema = z.object({
    SCRAPPING_BEE_API_KEY: z.string(),
  })

  return schema.parse(process.env)
}

export const config = {
  db: getDbConfig(),
  app: getAppConfig(),
  scrappingBee: getScrappingBeeConfig(),
}
