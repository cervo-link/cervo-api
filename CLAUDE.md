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
│   │   ├── middlewares/       # sessionAuth, apiKeyAuth, requireAbility
│   │   └── app.ts             # Fastify setup, Swagger UI, error handler
│   ├── factories/             # Resolve provider name → concrete adapter
│   ├── ports/                 # TypeScript interfaces for all adapters
│   └── lib/
│       └── abilities.ts       # CASL ability definitions (viewer/editor/owner)
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

## Role-Based Access Control

Memberships have a `role` column: `viewer | editor | owner`. Routes are guarded by `requireAbility(action, subject)` middleware from `src/infra/http/middlewares/workspace-role-auth.ts`.

**Ability matrix:**

| Role | Abilities |
|---|---|
| `owner` | `manage all` |
| `editor` | `read Workspace`, `read Link`, `manage Link` |
| `viewer` | `read Workspace`, `read Link` |

`requireAbility` reads `workspaceId` from route params, looks up the caller's role in the DB, builds a CASL ability, and returns 403 if the action is not allowed. It also validates that `workspaceId` is a valid UUID (returns 400 otherwise).

Bookmark creation (`POST /bookmarks`) enforces the `manage Link` ability using the `memberId` from the request body — this applies to both session and API-key (Discord bot) callers.

## HTTP Routes

Domain routes require API key auth (`Authorization: Bearer`, `X-API-Key`, or `?api_key`). Auth routes are handled by Better Auth with no API key required.

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Health check |
| GET/POST | `/api/auth/*` | none | Better Auth (OAuth sign-in, session, logout) |
| POST | `/bookmarks` | session or API key | Submit URL for processing |
| GET | `/bookmarks` | session or API key | Vector similarity search |
| POST | `/bookmarks/:id/retry` | session or API key | Retry failed bookmark |
| POST | `/members/create` | API key | Create member |
| PUT | `/members/add` | API key | Add member to workspace |
| POST | `/members/:memberId/identities` | API key | Link platform identity to member |
| GET | `/members/by-identity` | API key | Find member by platform identity |
| GET | `/members/me` | session | Get current authenticated member |
| POST | `/workspaces/create` | session or API key | Create workspace |
| GET | `/workspaces` | session or API key | Get workspace by ID |
| GET | `/workspaces/me` | session | List workspaces for authenticated member (with `role`) |
| PATCH | `/workspaces/:workspaceId` | session + owner | Update workspace |
| DELETE | `/workspaces/:workspaceId` | session + owner | Delete workspace |
| GET | `/workspaces/:workspaceId/members` | session + any member | List members with roles |
| POST | `/workspaces/:workspaceId/members` | session + owner | Invite member by email |
| DELETE | `/workspaces/:workspaceId/members/:memberId` | session + owner | Remove member |
| PATCH | `/workspaces/:workspaceId/members/:memberId` | session + owner | Change member role |
| POST | `/workspaces/:workspaceId/integrations` | session or API key | Add platform integration |
| GET | `/workspaces/by-integration` | session or API key | Find workspace by platform ID |

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
