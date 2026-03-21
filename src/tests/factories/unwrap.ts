import { DomainError } from '@/domain/errors/domain-error'

export function unwrapOrThrow<T>(result: T | DomainError): T {
  if (result instanceof DomainError) throw result
  return result
}
