import { DomainError } from './domain-error'

export class FailedToGetBookmarks extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Failed to get bookmarks', 500)
  }
}
