import { DomainError } from './domain-error'

export class CannotCreateDuplicatedMember extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Cannot create duplicated member', 422)
  }
}
