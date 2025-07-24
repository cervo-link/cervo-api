import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

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

async function waitForPostgres(dbUrl: string, retries = 10, delay = 500) {
  const { Client } = await import('pg')
  for (let i = 0; i < retries; i++) {
    try {
      const client = new Client({ connectionString: dbUrl })
      await client.connect()
      await client.end()
      return
    } catch (e) {
      await new Promise(res => setTimeout(res, delay))
    }
  }
  throw new Error('Postgres did not become ready in time')
}

export async function setup() {
  const container = await new GenericContainer('postgres')
    .withEnvironment({
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'cervo',
    })
    .withName('cervo-test-db')
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
  const db = drizzle(client)
  await waitForPostgres(dbUrl)
  await migrate(db, { migrationsFolder: './src/infra/db/migrations' }) // ajuste o path se necessário
  await client.end()

  return async () => {
    await global.__DB_CONFIG__?.container?.stop()
  }
}
