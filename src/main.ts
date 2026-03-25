import '@/infra/telemetry/otel'
import { startServer } from '@/infra/http/server'

async function main() {
  await startServer()
}

main().catch(err => {
  process.stderr.write(`Error initializing Cervo: ${err}\n`)
  process.exit(1)
})
