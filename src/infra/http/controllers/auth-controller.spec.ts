import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { findByEmail } from '@/infra/db/repositories/members-repository'
import app from '@/infra/http/app'

describe('authController (email + password)', () => {
  describe('POST /api/auth/sign-up/email', () => {
    it('should sign up a new user and create a member record', async () => {
      const email = `${faker.string.alphanumeric(8)}-${Date.now()}@example.com`
      const password = 'Password123!'
      const name = faker.person.fullName()

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name },
      })

      expect(response.statusCode).toBe(200)

      const body = JSON.parse(response.body) as { token: string; user: { id: string; email: string; name: string } }
      expect(body.token).toEqual(expect.any(String))
      expect(body.user.email).toBe(email)
      expect(body.user.name).toBe(name)

      // member record must have been created by the databaseHooks.user.create.after hook
      const member = await findByEmail(email)
      expect(member).not.toBeNull()
      expect(member?.email).toBe(email)
      expect(member?.userId).toEqual(expect.any(String))
    })

    it('should return 422 when email is already registered', async () => {
      const email = `${faker.string.alphanumeric(8)}-${Date.now()}@example.com`
      const password = 'Password123!'

      await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })

      expect(response.statusCode).toBe(422)
    })

    it('should return 422 when password is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email: faker.internet.email(), name: faker.person.fullName() },
      })

      expect(response.statusCode).toBe(422)
    })
  })

  describe('POST /api/auth/sign-in/email', () => {
    it('should sign in with valid credentials and return a session token', async () => {
      const email = `${faker.string.alphanumeric(8)}-${Date.now()}@example.com`
      const password = 'Password123!'

      await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password },
      })

      expect(response.statusCode).toBe(200)

      const body = JSON.parse(response.body) as { token: string; user: { email: string } }
      expect(body.token).toEqual(expect.any(String))
      expect(body.user.email).toBe(email)
    })

    it('should return 401 when password is wrong', async () => {
      const email = `${faker.string.alphanumeric(8)}-${Date.now()}@example.com`
      const password = 'Password123!'

      await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password: 'WrongPassword!' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 401 when email is not registered', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        headers: { 'content-type': 'application/json' },
        payload: {
          email: `notfound-${Date.now()}@example.com`,
          password: 'Password123!',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
