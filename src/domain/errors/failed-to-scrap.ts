import { DomainError } from './domain-error'

export class FailedToScrap extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Failed to scrap', 400)
  }
}
