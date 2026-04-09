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
│   │   ├── routes/
│   │   │   ├── api/           # /api/v1/* — session auth (web frontend)
│   │   │   ├── integrations/  # /integrations/v1/* — API key auth (bot/extensions)
│   │   │   ├── auth-routes.ts
│   │   │   ├── healthcheck.ts
│   │   │   └── waiting-list-routes.ts
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

Bookmark creation (`POST /api/v1/bookmarks` and `POST /integrations/v1/bookmarks`) enforces the `manage Link` ability using the `memberId` from the request body — this applies to both session and API key callers.

## HTTP Routes

Routes are split into two prefixed namespaces:

- **`/api/v1`** — session auth (cookie), consumed by the web frontend
- **`/integrations/v1`** — API key auth (`Authorization: Bearer`, `X-API-Key`, or `?api_key`), consumed by the Discord bot and Raycast extension

Unprefixed routes are unchanged.

### Unprefixed

| Method | URL | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Health check |
| GET/POST | `/api/auth/*` | none | Better Auth (OAuth sign-in, session, logout) |
| POST | `/waiting-list` | none | Join the waiting list |

### `/api/v1` — session auth (web frontend)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/bookmarks` | session | Submit URL for processing |
| GET | `/api/v1/bookmarks` | session | Vector similarity search |
| GET | `/api/v1/bookmarks/:id` | session | Get bookmark by ID |
| POST | `/api/v1/bookmarks/:id/retry` | session | Retry failed bookmark |
| DELETE | `/api/v1/bookmarks/:id` | session + manage Link | Delete bookmark |
| GET | `/api/v1/members/me` | session | Get current authenticated member |
| POST | `/api/v1/members/sync` | none | Sync Better Auth user → member record |
| POST | `/api/v1/members/me/identities` | session | Link provider identity, merge shadow member |
| GET | `/api/v1/members/me/identities` | session | List linked provider identities |
| POST | `/api/v1/workspaces/create` | session | Create workspace |
| GET | `/api/v1/workspaces` | session | Get workspace by ID |
| GET | `/api/v1/workspaces/me` | session | List workspaces for authenticated member (with `role`) |
| PATCH | `/api/v1/workspaces/:workspaceId` | session + update Workspace | Update name/description/visibility |
| DELETE | `/api/v1/workspaces/:workspaceId` | session + delete Workspace | Delete workspace |
| GET | `/api/v1/workspaces/:workspaceId/members` | session + read Workspace | List members with roles |
| POST | `/api/v1/workspaces/:workspaceId/members` | session + manage Member | Invite member by email |
| DELETE | `/api/v1/workspaces/:workspaceId/members/:memberId` | session + manage Member | Remove member |
| PATCH | `/api/v1/workspaces/:workspaceId/members/:memberId` | session + manage Member | Change member role |
| GET | `/api/v1/workspaces/:workspaceId/integrations` | session + read Workspace | List workspace integrations |
| POST | `/api/v1/workspaces/:workspaceId/integrations` | session + manage Workspace | Add platform integration |
| DELETE | `/api/v1/workspaces/:workspaceId/integrations/:integrationId` | session + manage Workspace | Remove platform integration |

### `/integrations/v1` — API key auth (Discord bot, Raycast)

| Method | URL | Auth | Description |
|---|---|---|---|
| POST | `/integrations/v1/bookmarks` | API key | Submit URL for processing |
| GET | `/integrations/v1/bookmarks` | API key | Vector similarity search |
| POST | `/integrations/v1/members/create` | API key | Create member |
| POST | `/integrations/v1/members/resolve` | API key | Resolve or create member by provider identity |
| PUT | `/integrations/v1/members/add` | API key | Add member to workspace |
| POST | `/integrations/v1/members/:memberId/identities` | API key | Link platform identity to member |
| GET | `/integrations/v1/members/by-identity` | API key | Find member by platform identity |
| POST | `/integrations/v1/workspaces/create` | API key | Create workspace |
| GET | `/integrations/v1/workspaces/by-member/:memberId` | API key | List workspaces a member belongs to |
| GET | `/integrations/v1/workspaces/:workspaceId/integrations` | API key | List workspace integrations |
| POST | `/integrations/v1/workspaces/:workspaceId/integrations` | API key | Add platform integration |
| DELETE | `/integrations/v1/workspaces/:workspaceId/integrations/:integrationId` | API key | Remove platform integration |
| GET | `/integrations/v1/workspaces/by-integration` | API key | Find workspace by provider ID |
| PATCH | `/integrations/v1/workspaces/by-integration` | API key | Update integration provider name |
| DELETE | `/integrations/v1/workspaces/by-integration` | API key | Remove integration by provider ID |

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
