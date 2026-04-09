import { describe, expect, it } from 'vitest'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { makeMember, makeRawMember } from '@/tests/factories/make-member'
import { executeTransaction } from '../utils/transactions'
import {
  findByEmail,
  findById,
  findByUserId,
  insertMember,
  insertMemberWithTransaction,
  updateUserId,
} from './members-repository'

describe('members-repository', () => {
  describe('insertMember', () => {
    it('should insert a member and return it', async () => {
      const raw = makeRawMember()
      const result = await insertMember(raw)

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: raw.name,
          email: raw.email,
          username: raw.username,
          active: true,
        })
      )
    })

    it('should return CannotCreateDuplicatedMember on duplicate email', async () => {
      const member = await makeMember()
      const result = await insertMember(makeRawMember({ email: member.email }))

      expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)
    })

    it('should return CannotCreateDuplicatedMember on duplicate username', async () => {
      const member = await makeMember()
      const result = await insertMember(
        makeRawMember({ username: member.username })
      )

      expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)
    })
  })

  describe('insertMemberWithTransaction', () => {
    it('should insert a member within a transaction', async () => {
      const raw = makeRawMember()
      const result = await executeTransaction(tx =>
        insertMemberWithTransaction(tx, raw)
      )

      expect(result).toEqual(
        expect.objectContaining({ email: raw.email, username: raw.username })
      )
    })
  })

  describe('findById', () => {
    it('should return the member when found', async () => {
      const member = await makeMember()
      const result = await findById(member.id)

      expect(result).toEqual(expect.objectContaining({ id: member.id }))
    })

    it('should return null when not found', async () => {
      const result = await findById('00000000-0000-0000-0000-000000000000')

      expect(result).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should return the member when found', async () => {
      const member = await makeMember()
      const result = await findByEmail(member.email as string)

      expect(result).toEqual(expect.objectContaining({ id: member.id }))
    })

    it('should return null when not found', async () => {
      const result = await findByEmail(`nonexistent-${Date.now()}@example.com`)

      expect(result).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should return the member when userId matches', async () => {
      const raw = makeRawMember()
      const userId = `user-${Date.now()}`
      const inserted = await insertMember({ ...raw, userId })

      const result = await findByUserId(userId)

      expect(result).toEqual(
        expect.objectContaining({ id: (inserted as { id: string }).id, userId })
      )
    })

    it('should return null when userId not found', async () => {
      const result = await findByUserId(`nonexistent-user-${Date.now()}`)

      expect(result).toBeNull()
    })
  })

  describe('updateUserId', () => {
    it('should update the userId of a member', async () => {
      const member = await makeMember()
      const newUserId = 'updated-user-id'

      await updateUserId(member.id, newUserId)

      const updated = await findById(member.id)
      expect(updated?.userId).toBe(newUserId)
    })
  })
})
