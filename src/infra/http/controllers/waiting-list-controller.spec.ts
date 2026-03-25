import { describe, expect, it } from 'vitest'
import app from '@/infra/http/app'
import { makeWaitingListEntry } from '@/tests/factories/make-waiting-list-entry'

describe('joinWaitingListController', () => {
  it('should join the waiting list', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        email: 'newuser@example.com',
        allowPromoEmails: false,
      },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.id).toBeDefined()
    expect(body.email).toBe('newuser@example.com')
    expect(body.allowPromoEmails).toBe(false)
    expect(body.createdAt).toBeDefined()
  })

  it('should default allowPromoEmails to false when not provided', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        email: 'defaultpromo@example.com',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = JSON.parse(response.body)
    expect(body.allowPromoEmails).toBe(false)
  })

  it('should return 200 when email is already on the waiting list', async () => {
    const entry = await makeWaitingListEntry()

    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        email: entry.email,
        allowPromoEmails: false,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ message: 'ok' })
  })

  it('should return 400 when email is invalid', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        email: 'not-an-email',
        allowPromoEmails: false,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 when email is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        allowPromoEmails: true,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('should not require authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/waiting-list',
      payload: {
        email: 'noauth@example.com',
        allowPromoEmails: false,
      },
    })

    expect(response.statusCode).toBe(201)
  })
})
