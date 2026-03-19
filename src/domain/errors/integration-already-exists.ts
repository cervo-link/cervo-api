import { DomainError } from './domain-error'

export class IntegrationAlreadyExists extends DomainError {
  constructor() {
    super('Integration already exists', 422)
  }
}
