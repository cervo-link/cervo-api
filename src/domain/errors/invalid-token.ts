import { DomainError } from './domain-error'

export class InvalidToken extends DomainError {
  constructor() {
    super('Invalid token', 401)
  }
}
