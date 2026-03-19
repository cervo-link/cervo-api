import { DomainError } from './domain-error'

export class BookmarkNotInFailedState extends DomainError {
  constructor() {
    super('Bookmark is not in failed state', 409)
  }
}
