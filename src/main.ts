import '@/infra/telemetry/otel'
import { startServer } from '@/infra/http/server'

async function main() {
  await startServer()
}

main().catch(err => {
  console.error('Error initializing Cervo', err)
})
