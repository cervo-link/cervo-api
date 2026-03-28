import { resolve } from 'node:path'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import { fastifySwagger } from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { type FastifyInstance, fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { config } from '@/config'
import { registerHttpRequestMetrics } from '@/infra/telemetry/http-request-metrics'
import { fastifyOtel } from '@/infra/telemetry/otel'
import { routes } from './routes'

const app = fastify({ logger: { level: 'info' } })

app.register(fastifyOtel.plugin())
registerHttpRequestMetrics(app)
setErrorHandler(app)
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.register(fastifyCors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

app.register(fastifyCookie)

app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    message: `Too many requests, please try again in ${context.after}`,
  }),
})

enableSagger(app)

routes(app)

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

    app.log.error({ err }, 'unhandled error')
    return reply.code(err.statusCode ?? 500).send({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode ?? 500,
    })
  })
}

function enableSagger(server: FastifyInstance) {
  if (config.app.NODE_ENV !== 'dev') {
    return
  }

  const spec = './infra/http/swagger/spec.json'
  const specFile = resolve(import.meta.dirname, '../..', spec)

  server.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Cervo API',
        version: '1.0.0',
        description:
          'API for managing bookmarks, workspaces, and members with API key authentication',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key',
            description: 'Enter your API key as a Bearer token',
          },
          apiKeyHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key in X-API-Key header',
          },
          apiKeyQuery: {
            type: 'apiKey',
            in: 'query',
            name: 'api_key',
            description: 'API key in query parameter',
          },
        },
      },
      security: [{ bearerAuth: [] }, { apiKeyHeader: [] }, { apiKeyQuery: [] }],
    },
    transform: transformSwaggerSchema,
  })

  server.register(fastifySwaggerUi, {
    routePrefix: '/swagger',
  })

  if (config.app.NODE_ENV === 'dev') {
    server.ready(async () => {
      await writeSwaggerSpec(server, specFile)
    })
  }
}

export async function writeSwaggerSpec(
  server: FastifyInstance,
  specFile: string
) {
  const apiSpec = JSON.stringify(server.swagger() || {}, null, 2)

  await Bun.write(specFile, apiSpec)
}

export function transformSwaggerSchema(
  data: Parameters<typeof jsonSchemaTransform>[0]
) {
  const { schema, url } = jsonSchemaTransform(data)

  if (schema?.consumes?.includes('multipart/form-data')) {
    schema.body = {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    }
  }

  return { schema, url }
}

export default app
