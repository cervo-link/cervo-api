import {
  boolean,
  char,
  foreignKey,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core'
import { v7 as uuidv7 } from 'uuid'
import { account, session, user, verification } from './auth-schema'

export const members = pgTable(
  'members',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    userId: text(),
    name: text(),
    username: text(),
    email: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    active: boolean().default(true).notNull(),
  },
  t => [
    uniqueIndex('email_member_idx').on(t.email),
    uniqueIndex('username_member_idx').on(t.username),
  ]
)

export const workspaces = pgTable('workspaces', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  ownerId: uuid(),
  name: text().notNull(),
  description: text(),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
  active: boolean().default(true).notNull(),
})

export const workspaceIntegrations = pgTable(
  'workspace_integrations',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: uuid().notNull(),
    provider: text().notNull(),
    providerId: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    active: boolean().default(true).notNull(),
  },
  t => [
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
    }),
    uniqueIndex('provider_provider_id_integration_idx').on(
      t.provider,
      t.providerId
    ),
  ]
)

export const memberPlatformIdentities = pgTable(
  'member_platform_identities',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    memberId: uuid().notNull(),
    provider: text().notNull(),
    providerUserId: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  t => [
    foreignKey({
      columns: [t.memberId],
      foreignColumns: [members.id],
    }),
    uniqueIndex('provider_provider_user_id_identity_idx').on(
      t.provider,
      t.providerUserId
    ),
  ]
)

export const memberships = pgTable(
  'memberships',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    memberId: uuid().notNull(),
    workspaceId: uuid().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  t => [
    foreignKey({
      columns: [t.memberId],
      foreignColumns: [members.id],
    }),
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
    }),
    unique('unique_member_workspace_idx').on(t.memberId, t.workspaceId),
  ]
)

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: uuid().notNull(),
    memberId: uuid().notNull(),
    url: text().notNull(),
    urlHashId: char('url_hash_id', { length: 64 }).notNull(),
    status: text('status').default('submitted').notNull(),
    title: text(),
    description: text(),
    tags: text('tags').array(),
    failureReason: text('failure_reason'),
    embedding: vector('embedding', { dimensions: 768 }),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    visible: boolean().default(true).notNull(),
  },
  t => [
    foreignKey({
      columns: [t.workspaceId],
      foreignColumns: [workspaces.id],
    }),
    foreignKey({
      columns: [t.memberId],
      foreignColumns: [members.id],
    }),
  ]
)

export const schema = {
  members,
  workspaces,
  workspaceIntegrations,
  memberPlatformIdentities,
  memberships,
  bookmarks,
  user,
  session,
  account,
  verification,
}
