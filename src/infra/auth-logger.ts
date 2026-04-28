import type { betterAuth } from 'better-auth'
import { logger } from '@/infra/logger'

type BetterAuthLogger = NonNullable<Parameters<typeof betterAuth>[0]['logger']>
type LogLevel = NonNullable<BetterAuthLogger['level']>

type LogData = Record<string, unknown>

const handlers: Record<LogLevel, (data: LogData, msg: string) => void> = {
  debug: (data, msg) => logger.debug(data, msg),
  info: (data, msg) => logger.info(data, msg),
  warn: (data, msg) => logger.warn(data, msg),
  error: (data, msg) => logger.error(data, msg),
}

function toMeta(args: unknown[]): LogData {
  if (args.length === 0) return {}
  const [first] = args
  if (args.length === 1 && typeof first === 'object' && first !== null) {
    return first as LogData
  }
  return { args }
}

export const betterAuthLogger: BetterAuthLogger = {
  level: 'info',
  log: (level, message, ...args) => {
    handlers[level](toMeta(args), `[better-auth] ${message}`)
  },
}
