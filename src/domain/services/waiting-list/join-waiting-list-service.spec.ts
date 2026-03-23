import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { EmailAlreadyOnWaitingList } from '@/domain/errors/email-already-on-waiting-list'
import { makeWaitingListEntry } from '@/tests/factories/make-waiting-list-entry'
import { joinWaitingList } from './join-waiting-list-service'

describe('joinWaitingList', () => {
  it('should add an email to the waiting list', async () => {
    const result = await joinWaitingList({
      email: 'test@example.com',
      allowPromoEmails: false,
    })

    expect(result).not.toBeInstanceOf(DomainError)
    if (!(result instanceof DomainError)) {
      expect(result.email).toBe('test@example.com')
      expect(result.allowPromoEmails).toBe(false)
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
    }
  })

  it('should store allowPromoEmails as true when provided', async () => {
    const result = await joinWaitingList({
      email: 'promo@example.com',
      allowPromoEmails: true,
    })

    expect(result).not.toBeInstanceOf(DomainError)
    if (!(result instanceof DomainError)) {
      expect(result.allowPromoEmails).toBe(true)
    }
  })

  it('should return EmailAlreadyOnWaitingList when email is duplicated', async () => {
    const entry = await makeWaitingListEntry()

    const result = await joinWaitingList({
      email: entry.email,
      allowPromoEmails: false,
    })

    expect(result).toBeInstanceOf(EmailAlreadyOnWaitingList)
    if (result instanceof DomainError) {
      expect(result.status).toBe(409)
    }
  })
})
