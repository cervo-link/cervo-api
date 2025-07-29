import { DrizzleQueryError } from 'drizzle-orm/errors'
import { PostgresError } from 'postgres'

export function getPgError(error: unknown): PostgresError | null {
  if (error instanceof DrizzleQueryError) {
    if (error.cause instanceof PostgresError) {
      return error.cause
    }
  }
  return null
}
