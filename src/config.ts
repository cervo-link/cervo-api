import { z } from 'zod'

function getDbConfig() {
  const schema = z.object({
    DATABASE_URL: z.string().url(),
  })

  return schema.parse(process.env)
}

export const config = {
  db: getDbConfig(),
}
