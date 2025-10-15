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

export const members = pgTable(
  'members',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text(),
    username: text(),
    email: text(),
    discordUserId: text(),
    passwordHash: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    active: boolean().default(true).notNull(),
  },
  t => [
    uniqueIndex('email_member_idx').on(t.email),
    uniqueIndex('username_member_idx').on(t.username),
    uniqueIndex('discord_user_id_member_idx').on(t.discordUserId),
  ]
)

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid()
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    name: text().notNull(),
    description: text(),
    platform: text().notNull(),
    platformId: text().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
    active: boolean().default(true).notNull(),
  },
  t => [
    uniqueIndex('platform_id_platform_workspace_idx').on(
      t.platformId,
      t.platform
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
    title: text(),
    description: text(),
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
  memberships,
  bookmarks,
}
