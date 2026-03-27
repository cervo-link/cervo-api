# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Start with hot-reload
bun run build            # TypeScript compilation

# Database
bun run db:generate      # Generate Drizzle migrations from schema changes
bun run db:migrate       # Apply migrations to DATABASE_URL
bun run db:migrate:test  # Apply migrations to test database

# Testing
bun run test             # Run all tests (requires Docker for Testcontainers)
bun run test:watch       # Watch mode
bun run test:coverage    # Coverage report

# Code quality (run in this order at the end of every phase)
bun run test
bun run typecheck        # tsc --noEmit
bun run lint:fix         # Biome auto-fix
bun run lint             # Biome lint check
```

Run a single test file: `bun --env-file=.env.test run vitest path/to/file.spec.ts`

## Architecture

Bookmark management API with vector search, built for Discord/Slack bot integration. Follows **Clean Architecture** — domain logic has zero framework or database dependencies.

```
src/
├── domain/           # Business logic (no framework dependencies)
│   ├── entities/    # TypeScript types inferred from Drizzle schema
│   ├── services/    # Business operations grouped by domain area
│   └── errors/      # Domain error classes (each has an HTTP status code)
│
├── infra/           # All implementation details
│   ├── adapters/
│   │   ├── gemma/             # Ollama/Gemma: summarize, title, tags, explain
│   │   ├── embeddinggemma/    # Ollama/Gemma: vector embeddings (768 dims)
│   │   ├── scrapping-bee/     # ScrapingBee web scraper
│   │   └── x/                 # X/Twitter oEmbed content extraction
│   ├── auth.ts                # Better Auth instance (OAuth, session management)
│   ├── db/
│   │   ├── schema/            # Drizzle ORM table definitions (source of truth)
│   │   ├── repositories/      # Data access layer — one file per table
│   │   └── migrations/        # SQL migration files
│   ├── http/
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # Route definitions with auth middleware
│   │   ├── schemas/           # Zod request/response schemas
│   │   ├── middlewares/       # apiKeyAuth
│   │   └── app.ts             # Fastify setup, Swagger UI, error handler
│   ├── factories/             # Resolve provider name → concrete adapter
│   └── ports/                 # TypeScript interfaces for all adapters
│
├── tests/
│   ├── global-setup.ts        # Spins up PostgreSQL Testcontainer, runs migrations
│   └── factories/             # Test data generators (makeMember, makeBookmark, etc.)
│
├── config.ts        # All env vars validated with Zod
└── main.ts          # Entry point
```

### Dependency flow

```
routes → controllers → factories → services → repositories / adapters
```

- Services receive adapters via function parameters (dependency injection)
- Factories instantiate the correct adapter from a provider name string
- Domain errors are **return values**, never thrown — callers check `instanceof DomainError`
- `@/*` path alias maps to `src/*`

## Key Patterns

### Error handling

Services return `T | DomainError`. Command functions that succeed silently return `DomainError | null`.

```typescript
// Query service
async function getBookmarks(...): Promise<Bookmark[] | DomainError>

// Command service
async function retryBookmark(...): Promise<DomainError | null>
```

Never use `Promise<void | DomainError>` or `Promise<undefined | DomainError>` — always `null` for the success case.

### Fire-and-forget processing

`createBookmark` inserts with `status: submitted` and returns immediately. Processing happens via `setImmediate`:

```typescript
setImmediate(() => processBookmark(id, scrappingService, embeddingService, summarizeService))
```

Non-critical steps (title, tags) never block `ready` status — their failures are silently ignored.

### Platform identity decoupling

`workspace_integrations` and `member_platform_identities` decouple core domain entities from platform-specific IDs. Adding a new platform (Slack, Teams) requires no schema changes to `members` or `workspaces`.

## Authentication

Authentication is handled by **Better Auth** (`src/infra/auth.ts`) with OAuth providers (Google, Discord).

- All `/api/auth/*` routes are handled by the Better Auth Fastify handler
- On first OAuth sign-in, a `member` record is automatically created via `databaseHooks.user.create.after`
- If a member with the same email already exists, their `userId` is linked to the Better Auth user
- Sessions use cookies — `FRONTEND_URL` must be set correctly for CORS to work

### OAuth callback URLs

Register these redirect URIs in your OAuth provider consoles:

| Provider | Callback URL |
|---|---|
| Google | `{BETTER_AUTH_URL}/api/auth/callback/google` |
| Discord | `{BETTER_AUTH_URL}/api/auth/callback/discord` |

### Session retrieval in routes

```typescript
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '@/infra/auth'

const session = await auth.api.getSession({
  headers: fromNodeHeaders(request.headers),
})
```

## Domain Services

| Service | Location | Returns |
|---|---|---|
| `createBookmark` | `bookmarks/create-bookmark-service` | `Bookmark \| DomainError` |
| `processBookmark` | `bookmarks/process-bookmark-service` | `DomainError \| null` |
| `getBookmarks` | `bookmarks/get-bookmark-service` | `BookmarkWithExplanation[] \| DomainError` |
| `retryBookmark` | `bookmarks/retry-bookmark-service` | `DomainError \| null` |
| `createWorkspace` | `workspace/create-workspace-service` | `Workspace \| DomainError` |
| `getWorkspace` | `workspace/get-workspace-service` | `Workspace \| DomainError` |
| `createMember` | `members/create-member-service` | `Member \| DomainError` |
| `addMemberToWorkspace` | `members/add-member-service` | `Membership \| DomainError` |
| `findMemberByPlatform` | `members/find-member-by-platform-service` | `Member \| DomainError` |
| `createMemberPlatformIdentity` | `members/create-member-platform-identity-service` | `MemberPlatformIdentity \| DomainError` |
| `getMembership` | `membership/get-membership` | `Membership \| DomainError` |
| `createWorkspaceIntegration` | `workspace-integrations/create-workspace-integration-service` | `WorkspaceIntegration \| DomainError` |
| `getWorkspaceByIntegration` | `workspace-integrations/get-workspace-by-integration-service` | `Workspace \| DomainError` |

## HTTP Routes

Domain routes require API key auth (`Authorization: Bearer`, `X-API-Key`, or `?api_key`). Auth routes are handled by Better Auth with no API key required.

| Method | URL | Description |
|---|---|---|
| GET | `/health` | Health check (no auth) |
| GET/POST | `/api/auth/*` | Better Auth handler (OAuth sign-in, session, logout) |
| POST | `/bookmarks` | Submit URL for processing |
| GET | `/bookmarks` | Vector similarity search (cross-workspace when isPersonal) |
| POST | `/bookmarks/:id/retry` | Retry failed bookmark |
| POST | `/members/create` | Create member |
| PUT | `/members/add` | Add member to workspace |
| POST | `/members/:memberId/identities` | Link platform identity to member |
| GET | `/members/by-identity` | Find member by platform identity |
| GET | `/members/me` | Get current authenticated member + workspace |
| POST | `/workspaces/create` | Create workspace |
| GET | `/workspaces` | Get workspace by ID |
| GET | `/workspaces/me` | Get workspaces for current authenticated member |
| POST | `/workspaces/:workspaceId/integrations` | Add platform integration |
| GET | `/workspaces/by-integration` | Find workspace by platform ID |

## Database

PostgreSQL with the `pgvector` extension (required). Bookmarks store 768-dimension embeddings.

Better Auth manages its own tables (`user`, `session`, `account`, `verification`) alongside the domain tables.

Docker Compose runs PostgreSQL + Grafana OTEL LGTM for local development:
```bash
docker compose up -d
```

After any schema change: `bun run db:generate` then `bun run db:migrate`.

## Testing

Tests use Testcontainers to spin up a real PostgreSQL instance — **no mocking the database**. External adapters (scraping, embedding, summarization) are mocked with `vi.fn()`.

Test factories in `src/tests/factories/` create real DB records. Use them instead of calling repositories directly in tests.

## Code Style

Biome enforces: single quotes, no semicolons, 2-space indent, 80-char line width.

`noNonNullAssertion` is enabled — avoid `!` assertions; cast with `as Type` where unavoidable.

`useImportType` is enabled — use `import type` for type-only imports.
