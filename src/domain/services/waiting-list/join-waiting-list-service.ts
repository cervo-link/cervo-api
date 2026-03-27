import { z } from 'zod'
import type { WaitingListEntry } from '@/domain/entities/waiting-list'
import type { DomainError } from '@/domain/errors/domain-error'
import { EmailAlreadyOnWaitingList } from '@/domain/errors/email-already-on-waiting-list'
import { insertWaitingListEntry } from '@/infra/db/repositories/waiting-list-repository'
import { withSpan } from '@/infra/utils/with-span'

export const joinWaitingListSchema = z.object({
  email: z.string().email('Email must be a valid email address'),
  allowPromoEmails: z.boolean().default(false),
})

export type JoinWaitingListInput = z.infer<typeof joinWaitingListSchema>

// Returns null when email is already registered (treated as success, not an error)
export async function joinWaitingList(
  params: JoinWaitingListInput
): Promise<WaitingListEntry | DomainError | null> {
  return withSpan('join-waiting-list', async () => {
    const result = await insertWaitingListEntry(params)
    if (result instanceof EmailAlreadyOnWaitingList) return null
    return result
  })
}
