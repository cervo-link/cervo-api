import { type Span, type Tracer, trace } from '@opentelemetry/api'

export async function withSpan<T>(
  name: string,
  handler: (span: Span, tracer: Tracer) => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer(name)
  return tracer.startActiveSpan(name, async span => {
    try {
      return await handler(span, tracer)
    } finally {
      span.end()
    }
  })
}
