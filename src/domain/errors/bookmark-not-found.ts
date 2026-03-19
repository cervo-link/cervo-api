import { DomainError } from './domain-error'

export class BookmarkNotFound extends DomainError {
  constructor() {
    super('Bookmark not found', 404)
  }
}
