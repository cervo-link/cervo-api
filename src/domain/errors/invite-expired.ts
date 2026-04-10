import { DomainError } from './domain-error'

export class InviteExpired extends DomainError {
  constructor(message?: string) {
    super(message ?? 'This invite has expired', 400)
  }
}
