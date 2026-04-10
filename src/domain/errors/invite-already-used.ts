import { DomainError } from './domain-error'

export class InviteAlreadyUsed extends DomainError {
  constructor(message?: string) {
    super(message ?? 'This invite has already been used', 400)
  }
}
