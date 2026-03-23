import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { schema } from '@/infra/db/schema'

export const waitingListEntrySchema = createSelectSchema(schema.waitingList)

export const joinWaitingListBodySchemaRequest = z.object({
  email: z.string().email('Email must be a valid email address'),
  allowPromoEmails: z.boolean().default(false),
})

export const joinWaitingListBodySchemaResponse = {
  201: waitingListEntrySchema.describe('Successfully joined the waiting list'),
  200: z.object({ message: z.string() }).describe('Email already registered'),
  400: z.object({ message: z.string() }).describe('Invalid request body'),
  500: z.object({ message: z.string() }).describe('Internal server error'),
}
