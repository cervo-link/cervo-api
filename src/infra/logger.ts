import { SeverityNumber } from '@opentelemetry/api-logs'
import { getOtelLogger } from './telemetry/otel'

type LogData = Record<string, unknown>
type LogArgs = [string | LogData, string?]

function emit(severityNumber: SeverityNumber, severityText: string, args: LogArgs) {
  const [first, second] = args
  const body = typeof first === 'string' ? first : (second ?? '')
  const attributes = typeof first === 'object' ? (first as Record<string, string>) : {}
  getOtelLogger().emit({ severityNumber, severityText, body, attributes })
}

export const logger = {
  debug: (...args: LogArgs) => emit(SeverityNumber.DEBUG, 'DEBUG', args),
  info: (...args: LogArgs) => emit(SeverityNumber.INFO, 'INFO', args),
  warn: (...args: LogArgs) => emit(SeverityNumber.WARN, 'WARN', args),
  error: (...args: LogArgs) => emit(SeverityNumber.ERROR, 'ERROR', args),
}
