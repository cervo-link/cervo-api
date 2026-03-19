import { DomainError } from './domain-error'

export class IdentityAlreadyExists extends DomainError {
  constructor() {
    super('Platform identity already exists', 422)
  }
}
