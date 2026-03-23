import { DomainError } from './domain-error'

export class EmailAlreadyOnWaitingList extends DomainError {
  constructor() {
    super('Email already on waiting list', 409)
  }
}
