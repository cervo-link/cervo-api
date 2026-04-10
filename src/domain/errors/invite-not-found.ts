import { DomainError } from './domain-error'

export class InviteNotFound extends DomainError {
  constructor(message?: string) {
    super(message ?? 'Invite not found', 404)
  }
}
