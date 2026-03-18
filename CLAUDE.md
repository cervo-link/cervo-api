# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev           # Start with hot-reload
bun run build         # TypeScript compilation

# Database
bun run db:generate   # Generate Drizzle migrations
bun run db:migrate    # Apply migrations
bun run db:migrate:test  # Apply migrations to test DB

# Testing
bun run test          # Run all tests (requires Docker for Testcontainers)
bun run test:watch    # Watch mode

# Code quality
bun run lint          # Check with Biome
bun run format        # Auto-format with Biome
```

To run a single test file: `bun --env-file=.env.test run vitest path/to/file.spec.ts`

## Architecture

This is a bookmark management API with vector search, built for integration with chat platforms (Discord, Slack). It follows **Clean Architecture**:

```
src/
├── domain/           # Business logic (no framework dependencies)
│   ├── entities/    # Core models: Bookmark, Workspace, Member, Membership
│   ├── services/    # Business operations (create, find, get)
│   └── errors/      # Domain-specific error classes
│
├── infra/           # All implementation details
│   ├── adapters/    # External service integrations
│   │   ├── scrapping-bee/     # Web scraping (ScrapingBee API)
│   │   ├── gemma/             # Text summarization (Ollama/Gemma)
│   │   └── embeddinggemma/    # Vector embeddings (Ollama/Gemma)
│   ├── db/
│   │   ├── schema/            # Drizzle ORM table definitions
│   │   ├── repositories/      # Data access layer
│   │   └── migrations/        # SQL migration files
│   ├── http/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Route definitions with auth middleware
│   │   ├── schemas/           # Zod request/response schemas
│   │   └── app.ts             # Fastify app setup
│   ├── factories/   # Wire up services with their dependencies
│   └── ports/       # Interfaces for external adapters
│
├── tests/
│   ├── global-setup.ts        # Spins up PostgreSQL Testcontainer, runs migrations
│   └── factories/             # Test data generators
│
├── config.ts        # Env vars validated with Zod
└── main.ts          # Entry point
```

### Key Patterns

**Dependency flow**: `routes → controllers → factories → services → repositories/adapters`

- Services receive adapters via constructor (dependency injection)
- Factories instantiate services with concrete implementations
- Services return domain errors or success values (no exceptions for domain errors)
- `@/*` path alias maps to `src/*`

### Database

PostgreSQL with the `pgvector` extension (required). Bookmarks store 768-dimension embeddings for vector similarity search.

Docker Compose runs PostgreSQL + Grafana OTEL LGTM for local development:
```bash
docker compose up -d
```

### Testing

Tests use Testcontainers to spin up a real PostgreSQL instance — no mocking the database. External adapters (scraping, embedding, summarization) are mocked in unit tests.

### API Authentication

All routes require an API key via:
- `Authorization: Bearer <api-key>`
- `X-API-Key: <api-key>` header
- `?api_key=<api-key>` query param

### Code Style

Biome enforces: single quotes, no semicolons, 2-space indent, 80-char line width.
