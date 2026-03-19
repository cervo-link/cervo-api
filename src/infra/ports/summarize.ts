import type { Tracer } from '@opentelemetry/api'
import type { DomainError } from '@/domain/errors/domain-error'

export type SummarizeService = {
  summarize(text: string, tracer: Tracer): Promise<string | DomainError>
  generateTitle(text: string, tracer: Tracer): Promise<string | DomainError>
  generateTags(text: string, tracer: Tracer): Promise<string[] | DomainError>
}
