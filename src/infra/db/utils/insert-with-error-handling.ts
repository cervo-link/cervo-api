import { DomainError } from '@/domain/errors/domain-error'
import { getPgError } from './get-pg-error'
import { PgIntegrityConstraintViolation } from './postgres-error-codes'

export async function handleInsertError<T>(
  insert: () => Promise<T[]>,
  onUniqueViolation: new () => DomainError,
  context: string
): Promise<T | DomainError> {
  try {
    const [result] = await insert()
    return result
  } catch (error) {
    const pgError = getPgError(error)
    if (pgError?.code === PgIntegrityConstraintViolation.UniqueViolation) {
      return new onUniqueViolation()
    }
    return new DomainError(`${context}: ${error as string}`, 500)
  }
}
