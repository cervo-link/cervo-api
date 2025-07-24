import { client } from '.'

async function main() {
  console.info('🌱 Database seeded!')
}

main()
  .catch(err => console.error(err))
  .finally(() => client.end())
