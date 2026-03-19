import { DomainError } from './domain-error'

export class IntegrationNotFound extends DomainError {
  constructor() {
    super('Integration not found', 404)
  }
}
