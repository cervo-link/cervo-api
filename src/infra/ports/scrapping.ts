import type { DomainError } from '@/domain/errors/domain-error'

export type ScrappingService = {
  scrapping(url: string): Promise<string | DomainError>
}
