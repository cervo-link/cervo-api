import { DomainError } from './domain-error'

export class TokenExpired extends DomainError {
  constructor() {
    super('Token expired', 401)
  }
}
