import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { makeWaitingListEntry } from '@/tests/factories/make-waiting-list-entry'
import { joinWaitingList } from './join-waiting-list-service'

describe('joinWaitingList', () => {
  it('should add an email to the waiting list', async () => {
    const result = await joinWaitingList({
      email: 'test@example.com',
      allowPromoEmails: false,
    })

    assert(!(result instanceof DomainError))
    expect(result).not.toBeNull()
    expect(result?.email).toBe('test@example.com')
    expect(result?.allowPromoEmails).toBe(false)
    expect(result?.id).toBeDefined()
    expect(result?.createdAt).toBeDefined()
  })

  it('should store allowPromoEmails as true when provided', async () => {
    const result = await joinWaitingList({
      email: 'promo@example.com',
      allowPromoEmails: true,
    })

    assert(!(result instanceof DomainError))
    expect(result).not.toBeNull()
    expect(result?.allowPromoEmails).toBe(true)
  })

  it('should return null when email is already on the waiting list', async () => {
    const entry = await makeWaitingListEntry()

    const result = await joinWaitingList({
      email: entry.email,
      allowPromoEmails: false,
    })

    expect(result).toBeNull()
  })
})
