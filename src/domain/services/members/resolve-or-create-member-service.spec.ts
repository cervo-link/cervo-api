import assert from 'node:assert'
import { describe, expect, it } from 'vitest'
import { DomainError } from '@/domain/errors/domain-error'
import { findMemberByProviderIdentity } from '@/infra/db/repositories/member-platform-identities-repository'
import { makeMember } from '@/tests/factories/make-member'
import { makeMemberPlatformIdentity } from '@/tests/factories/make-member-platform-identity'
import { resolveOrCreateMember } from './resolve-or-create-member-service'

describe('resolveOrCreateMember', () => {
  it('should return existing member when identity already exists', async () => {
    const member = await makeMember()
    await makeMemberPlatformIdentity({
      memberId: member.id,
      provider: 'discord',
      providerUserId: 'discord-known-user',
    })

    const result = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId: 'discord-known-user',
      displayName: 'Should Not Matter',
    })

    assert(!(result instanceof DomainError))
    expect(result.id).toBe(member.id)
  })

  it('should create a shadow member and identity when provider user is unknown', async () => {
    const result = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId: `new-discord-user-${Date.now()}`,
      displayName: 'Ghost User',
    })

    assert(!(result instanceof DomainError))
    expect(result.name).toBe('Ghost User')
    expect(result.email).toBeNull()
    expect(result.username).toBeNull()
    expect(result.userId).toBeNull()
  })

  it('should create the platform identity record for the shadow member', async () => {
    const providerUserId = `identity-check-${Date.now()}`

    const result = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId,
      displayName: 'Identity Check',
    })

    assert(!(result instanceof DomainError))
    const identity = await findMemberByProviderIdentity('discord', providerUserId)
    expect(identity).not.toBeNull()
    expect(identity?.id).toBe(result.id)
  })

  it('should be idempotent — same providerUserId returns same memberId', async () => {
    const providerUserId = `idempotent-${Date.now()}`

    const first = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId,
      displayName: 'First Call',
    })

    const second = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId,
      displayName: 'Second Call',
    })

    assert(!(first instanceof DomainError))
    assert(!(second instanceof DomainError))
    expect(second.id).toBe(first.id)
  })

  it('should treat same providerUserId on different providers as distinct members', async () => {
    const providerUserId = `cross-provider-${Date.now()}`

    const discord = await resolveOrCreateMember({
      provider: 'discord',
      providerUserId,
      displayName: 'Discord User',
    })

    const github = await resolveOrCreateMember({
      provider: 'github',
      providerUserId,
      displayName: 'GitHub User',
    })

    assert(!(discord instanceof DomainError))
    assert(!(github instanceof DomainError))
    expect(discord.id).not.toBe(github.id)
  })
})
