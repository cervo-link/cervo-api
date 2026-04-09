import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { MembershipRole } from '@/infra/db/schema'

export function defineAbilitiesFor(role: MembershipRole | null) {
  const { can, build } = new AbilityBuilder(createMongoAbility)

  if (role === 'owner') {
    can('manage', 'all')
    return build()
  }

  if (role === 'editor') {
    can('read', ['Workspace', 'Link'])
    can('manage', 'Link')
    return build()
  }

  if (role === 'viewer') {
    can('read', ['Workspace', 'Link'])
    return build()
  }

  return build()
}
