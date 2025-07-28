import type { InsertMember, Member } from '@/domain/entities/member'

import { members } from '@/infra/db/schema'
import { db } from '@/infra/db/'
import { eq } from 'drizzle-orm'
import type { Transaction } from '../utils/transactions'

export async function insertMember(member: InsertMember): Promise<Member> {
  const [result] = await db.insert(members).values(member).returning()
  return result
}

export async function insertMemberWithTransaction(
  tx: Transaction,
  member: InsertMember
): Promise<Member> {
  const [result] = await tx.insert(members).values(member).returning()
  return result
}

export async function findById(id: string): Promise<Member | null> {
  const [result] = await db.select().from(members).where(eq(members.id, id))
  return result
}
