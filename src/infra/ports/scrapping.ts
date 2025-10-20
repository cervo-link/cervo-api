import type { Tracer } from '@opentelemetry/api'
import type { DomainError } from '@/domain/errors/domain-error'

export type ScrappingService = {
  scrapping(url: string, tracer: Tracer): Promise<string | DomainError>
}
