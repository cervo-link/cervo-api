import pino from 'pino'

export const logger = pino({
  level: 'info',
  transport:
    process.env.NODE_ENV === 'dev'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})
