import { DomainError } from './domain-error'

export class NotAShadowMember extends DomainError {
  constructor() {
    super('Target member is not a shadow member', 422)
  }
}
