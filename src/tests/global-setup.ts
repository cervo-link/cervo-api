import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'
import { GenericContainer, type StartedTestContainer } from 'testcontainers'

let dbConfig: {
  host: string
  port: number
  user: string
  password: string
  database: string
  container: StartedTestContainer
}

declare global {
  // eslint-disable-next-line no-var
  var __DB_CONFIG__: typeof dbConfig
}

export async function setup() {
  await setupDatabase()

  return async () => {
    await global.__DB_CONFIG__?.container?.stop()
  }
}

async function setupDatabase() {
  const container = await new GenericContainer('pgvector/pgvector:pg16')
    .withEnvironment({
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'cervo',
    })
    .withExposedPorts(5432)
    .start()

  dbConfig = {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: 'postgres',
    password: 'test',
    database: 'cervo',
    container,
  }

  const dbUrl = `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
  process.env.DATABASE_URL = dbUrl

  global.__DB_CONFIG__ = dbConfig

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  await client.query('CREATE EXTENSION IF NOT EXISTS vector;')

  const db = drizzle(client)
  await migrate(db, { migrationsFolder: './src/infra/db/migrations' })
  await client.end()
}
