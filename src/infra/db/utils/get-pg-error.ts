import { DrizzleQueryError } from 'drizzle-orm/errors'

interface PostgresError {
  code: string
  message: string
  name: string
  [key: string]: unknown
}

export function getPgError(error: unknown): PostgresError | null {
  if (error instanceof DrizzleQueryError) {
    if (
      error.cause &&
      typeof error.cause === 'object' &&
      'code' in error.cause
    ) {
      return error.cause as PostgresError
    }
  }
  return null
}
