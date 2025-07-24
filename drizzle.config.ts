import type { Config } from 'drizzle-kit'

import { config } from '@/config'

export default {
  schema: 'src/infra/db/schema/*',
  out: 'src/infra/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: config.db.DATABASE_URL },
  schemaFilter: ['auth', 'public'],
  casing: 'snake_case',
  migrations: {
    prefix: 'timestamp',
  },
} satisfies Config
