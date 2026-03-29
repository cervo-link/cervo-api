import { DomainError } from './domain-error'

export class IdentityAlreadyLinked extends DomainError {
  constructor() {
    super('This identity is already linked to your account', 409)
  }
}
