import { DomainError } from './domain-error'

export class FailedToGenerateEmbedding extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Failed to generate embedding', 400)
  }
}
