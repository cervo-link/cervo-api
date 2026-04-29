import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { findByEmail } from '@/infra/db/repositories/members-repository'
import app from '@/infra/http/app'

// Better Auth normalises emails to lowercase before storing/returning them.
// All test emails are lowercased at the source to match what the API returns.
function uniqueEmail(): string {
  return `${faker.string.alphanumeric(8)}-${Date.now()}@example.com`.toLowerCase()
}

type SignUpBody = { token: string; user: { id: string; email: string; name: string } }
type SignInBody = { token: string; user: { email: string } }

describe('authController (email + password)', () => {
  describe('POST /api/auth/sign-up/email', () => {
    it('should sign up a new user and create a member record', async () => {
      const email = uniqueEmail()
      const password = 'Password123!'
      const name = faker.person.fullName()

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name },
      })

      expect(response.statusCode).toBe(200)

      const body = JSON.parse(response.body) as SignUpBody
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
      const email = uniqueEmail()
      const password = 'Password123!'

      const first = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })
      expect(first.statusCode).toBe(200) // guard: first sign-up must succeed

      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email, password, name: faker.person.fullName() },
      })

      expect(response.statusCode).toBe(422)
    })

    it('should return 400 when password is missing', async () => {
      // Better Auth returns 400 (Bad Request) for missing required fields,
      // not 422 — 422 is reserved for semantic errors like duplicate email.
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        headers: { 'content-type': 'application/json' },
        payload: { email: uniqueEmail(), name: faker.person.fullName() },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/auth/sign-in/email', () => {
    it('should sign in with valid credentials and return a session token', async () => {
      const email = uniqueEmail()
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

      const body = JSON.parse(response.body) as SignInBody
      expect(body.token).toEqual(expect.any(String))
      expect(body.user.email).toBe(email)
    })

    it('should return 401 when password is wrong', async () => {
      const email = uniqueEmail()
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
