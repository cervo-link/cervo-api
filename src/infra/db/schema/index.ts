import { pgTable, text } from 'drizzle-orm/pg-core'

export const banana = pgTable('banana', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
})

export const schema = {
  banana,
}
