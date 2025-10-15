import type { DomainError } from '@/domain/errors/domain-error'

export type SummarizeService = {
  summarize(text: string): Promise<string | DomainError>
}
