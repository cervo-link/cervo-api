import { startServer } from '@/infra/http/server'

async function main() {
  startServer()
}

main().catch(err => {
  console.error('Error initializing Cervo', err)
})
