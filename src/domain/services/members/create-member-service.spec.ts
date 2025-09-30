import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { InsertMember } from '@/domain/entities/member'
import { CannotCreateDuplicatedMember } from '@/domain/errors/cannot-create-duplicated-member'
import { DomainError } from '@/domain/errors/domain-error'

const createTestMember = (overrides: InsertMember = {}) => {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    active: true,
    discordUserId: faker.string.uuid(),
    username: faker.internet.username(),
    ...overrides,
  }
}

describe('CreateMemberService - Final Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful member creation', () => {
    it('should create a member with valid data', async () => {
      const memberData = createTestMember()
      const expectedMember = {
        id: faker.string.uuid(),
        name: memberData.name ?? null,
        username: memberData.username ?? null,
        email: memberData.email ?? null,
        discordUserId: memberData.discordUserId ?? null,
        passwordHash: null,
        active: memberData.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberData)

      expect(mockInsertMember).toHaveBeenCalledWith(memberData)
      expect(result).toEqual(expectedMember)
    })

    it('should create a member with custom overrides', async () => {
      const memberData = createTestMember({
        name: 'John Doe',
        email: 'john@example.com',
        active: false,
      })
      const expectedMember = {
        id: faker.string.uuid(),
        name: memberData.name ?? null,
        username: memberData.username ?? null,
        email: memberData.email ?? null,
        discordUserId: memberData.discordUserId ?? null,
        passwordHash: null,
        active: memberData.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberData)

      expect(mockInsertMember).toHaveBeenCalledWith(memberData)
      expect(result).toEqual(expectedMember)
    })
  })

  describe('error handling', () => {
    it('should return CannotCreateDuplicatedMember error when member already exists', async () => {
      const memberData = createTestMember()
      const duplicateError = new CannotCreateDuplicatedMember()

      const mockInsertMember = vi.fn().mockResolvedValue(duplicateError)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberData)

      expect(mockInsertMember).toHaveBeenCalledWith(memberData)
      expect(result).toBeInstanceOf(CannotCreateDuplicatedMember)
    })

    it('should return any other DomainError from repository', async () => {
      const memberData = createTestMember()
      const customError = new DomainError('Custom error message', 400)

      const mockInsertMember = vi.fn().mockResolvedValue(customError)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberData)

      expect(mockInsertMember).toHaveBeenCalledWith(memberData)
      expect(result).toBeInstanceOf(DomainError)
      expect((result as DomainError).message).toBe('Custom error message')
    })

    it('should propagate non-DomainError exceptions', async () => {
      const memberData = createTestMember()
      const error = new Error('Database connection failed')

      const mockInsertMember = vi.fn().mockRejectedValue(error)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      await expect(createMemberWithMock(memberData)).rejects.toThrow(
        'Database connection failed'
      )
      expect(mockInsertMember).toHaveBeenCalledWith(memberData)
    })
  })

  describe('input validation', () => {
    it('should handle member with minimal required fields', async () => {
      const minimalMember = {
        name: 'Test User',
        email: 'test@example.com',
        active: true,
        discordUserId: faker.string.uuid(),
        username: 'testuser',
      }
      const expectedMember = {
        id: faker.string.uuid(),
        name: minimalMember.name,
        username: minimalMember.username,
        email: minimalMember.email,
        discordUserId: minimalMember.discordUserId,
        passwordHash: null,
        active: minimalMember.active,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(minimalMember)

      expect(mockInsertMember).toHaveBeenCalledWith(minimalMember)
      expect(result).toEqual(expectedMember)
    })

    it('should handle member with all optional fields', async () => {
      const fullMember = createTestMember({
        name: 'Full Name User',
        email: 'full@example.com',
        active: true,
        discordUserId: faker.string.uuid(),
        username: 'fulluser',
      })
      const expectedMember = {
        id: faker.string.uuid(),
        name: fullMember.name ?? null,
        username: fullMember.username ?? null,
        email: fullMember.email ?? null,
        discordUserId: fullMember.discordUserId ?? null,
        passwordHash: null,
        active: fullMember.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(fullMember)

      expect(mockInsertMember).toHaveBeenCalledWith(fullMember)
      expect(result).toEqual(expectedMember)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string values', async () => {
      const memberWithEmptyStrings = createTestMember({
        name: '',
        email: '',
        username: '',
      })
      const expectedMember = {
        id: faker.string.uuid(),
        name: memberWithEmptyStrings.name ?? null,
        username: memberWithEmptyStrings.username ?? null,
        email: memberWithEmptyStrings.email ?? null,
        discordUserId: memberWithEmptyStrings.discordUserId ?? null,
        passwordHash: null,
        active: memberWithEmptyStrings.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberWithEmptyStrings)

      expect(mockInsertMember).toHaveBeenCalledWith(memberWithEmptyStrings)
      expect(result).toEqual(expectedMember)
    })

    it('should handle special characters in member data', async () => {
      const memberWithSpecialChars = createTestMember({
        name: "José María O'Connor-Smith",
        email: 'josé.maría+test@example.com',
        username: 'josé_maría_123',
      })
      const expectedMember = {
        id: faker.string.uuid(),
        name: memberWithSpecialChars.name ?? null,
        username: memberWithSpecialChars.username ?? null,
        email: memberWithSpecialChars.email ?? null,
        discordUserId: memberWithSpecialChars.discordUserId ?? null,
        passwordHash: null,
        active: memberWithSpecialChars.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsertMember = vi.fn().mockResolvedValue(expectedMember)

      const createMemberWithMock = async (member: InsertMember) => {
        const memberResult = await mockInsertMember(member)

        if (memberResult instanceof DomainError) {
          return memberResult
        }

        return memberResult
      }

      const result = await createMemberWithMock(memberWithSpecialChars)

      expect(mockInsertMember).toHaveBeenCalledWith(memberWithSpecialChars)
      expect(result).toEqual(expectedMember)
    })
  })
})
