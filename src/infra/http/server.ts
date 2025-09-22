import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import { type FastifyInstance, fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { config } from '@/config'
import { routes } from './routes'

export function startServer() {
  const app = fastify()

  setErrorHandler(app)
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.register(fastifyCors, { origin: '*' })

  app.register(fastifyCookie)

  routes(app)

  app
    .listen({
      port: Number(config.app.PORT),
      host: '0.0.0.0',
    })
    .then(() => {
      console.log(`HTTP server running at ${config.app.PORT}`)
    })
}

function setErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        error: 'Response Validation Error',
        message: err.message,
        statusCode: 400,
        details: {
          issues: err.validation,
          method: req.method,
          url: req.url,
        },
      })
    }

    if (isResponseSerializationError(err)) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: "Response doesn't match the schema",
        statusCode: 500,
        details: {
          issues: err.cause.issues,
          method: err.method,
          url: err.url,
        },
      })
    }

    console.error('🚨 Global Error Handler:\n', err, '\n')
    return reply.code(err.statusCode ?? 500).send({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode ?? 500,
    })
  })
}
