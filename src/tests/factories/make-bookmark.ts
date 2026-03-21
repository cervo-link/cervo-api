import { createHash } from 'node:crypto'
import { faker } from '@faker-js/faker'

import type { InsertBookmark } from '@/domain/entities/bookmark'
import { insertBookmark } from '@/infra/db/repositories/bookmark-repository'
import { makeRawEmbedding } from './make-embedding'
import { unwrapOrThrow } from './unwrap'

type Overrides = Partial<Omit<InsertBookmark, 'workspaceId' | 'memberId'>> & {
  workspaceId: string
  memberId: string
}

export function makeRawBookmark(overrides: Overrides): InsertBookmark {
  const url = overrides.url || faker.internet.url()
  const urlHashId = createHash('sha256').update(url).digest('hex')

  return {
    workspaceId: overrides.workspaceId,
    memberId: overrides.memberId,
    url,
    urlHashId,
    status: overrides.status || 'ready',
    title: overrides.title || faker.lorem.sentence(),
    description: overrides.description || faker.lorem.paragraph(),
    embedding: overrides.embedding || makeRawEmbedding(),
    visible: overrides.visible ?? true,
    tags: overrides.tags ?? null,
    failureReason: overrides.failureReason ?? null,
  }
}

export async function makeBookmark(overrides: Overrides) {
  return unwrapOrThrow(await insertBookmark(makeRawBookmark(overrides)))
}
