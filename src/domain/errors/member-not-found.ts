import { DomainError } from './domain-error'

export class MemberNotFound extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Member not found', 204)
  }
}
