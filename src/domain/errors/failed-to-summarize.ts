import { DomainError } from './domain-error'

export class FailedToSummarize extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Failed to summarize content', 400)
  }
}
