import { DomainError } from './domain-error'

export class FailedToCreateBookmark extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Failed to create bookmark', 500)
  }
}
