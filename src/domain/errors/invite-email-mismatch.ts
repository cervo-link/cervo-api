import { DomainError } from './domain-error'

export class InviteEmailMismatch extends DomainError {
  constructor(message?: string) {
    super(message ?? 'This invite was sent to a different email', 403)
  }
}
