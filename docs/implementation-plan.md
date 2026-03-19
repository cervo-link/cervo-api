# Cervo API — Implementation Plan

> Focus: backend API only. Discord bot updates are deferred to a separate phase.
> Decisions: fire-and-forget async, JWT + magic link auth, tags as text array, Gemma for "matched because" (deferred).

---

## Current State

- Workspace has `platform` + `platformId` (being removed)
- Members have `discordUserId` (being removed)
- Bookmark processing is synchronous (scrape + embed + summarize inline)
- Auth is a single shared API key
- No link states, no tags, no workspace privacy

---

## Phase 1 — Schema Completion

> The `workspace_integrations` and `member_platform_identities` tables were already added. This phase completes the schema for features we're about to build.

### 1.1 Bookmarks table additions
- Add `status` text column with values: `submitted | processing | ready | failed` — default `submitted`
- Add `tags` text array column — nullable, default null
- Add `rawText` text column (already exists — confirm it's there)

### 1.2 Workspaces table additions
- Add `isPublic` boolean column — default `false`
- Add `ownerId` uuid column (FK → members.id) — tracks who created the workspace

### 1.3 Magic link tokens table
New table `magic_link_tokens`:
- `id` uuid PK
- `memberId` uuid FK → members.id
- `token` text NOT NULL UNIQUE
- `expiresAt` timestamp NOT NULL
- `usedAt` timestamp nullable
- `createdAt` timestamp DEFAULT now()

### 1.4 Refresh tokens table
New table `refresh_tokens`:
- `id` uuid PK
- `memberId` uuid FK → members.id
- `token` text NOT NULL UNIQUE
- `expiresAt` timestamp NOT NULL
- `revokedAt` timestamp nullable
- `createdAt` timestamp DEFAULT now()

**Deliverables:** updated `schema/index.ts`, run `bun run db:generate`, rename migration to a descriptive name, run `bun run db:migrate`.

---

## Phase 2 — Auth

> JWT-based auth with magic link email. The existing API key middleware is replaced. Members become first-class users.

### 2.1 Config
- Add `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN` (default `15m`), `JWT_REFRESH_EXPIRES_IN` (default `7d`)
- Add `MAGIC_LINK_EXPIRES_IN` (default `15m`)
- Add `APP_URL` (used to build the magic link URL)
- Add `SMTP_*` vars for email sending (host, port, user, pass, from)

### 2.2 Ports
- `src/infra/ports/email.ts` — `EmailService` interface: `sendMagicLink(to, link)`

### 2.3 Adapters
- `src/infra/adapters/nodemailer/index.ts` — implements `EmailService` using nodemailer
- For local dev, use a console logger adapter (just logs the link) so no SMTP is needed

### 2.4 Domain — Auth services
- `src/domain/services/auth/request-magic-link-service.ts`
  - Accepts `email`
  - If member doesn't exist → create it (auto-register)
  - Generate a secure random token, store in `magic_link_tokens` with expiry
  - Call `emailService.sendMagicLink(email, link)`
  - Returns `void` — always 200 regardless of whether email exists (security)
  - Span: `request-magic-link`

- `src/domain/services/auth/verify-magic-link-service.ts`
  - Accepts `token`
  - Find token in `magic_link_tokens`, validate not expired and not used
  - Mark token as used (`usedAt = now()`)
  - If member has no workspace yet → create one (personal workspace) and add membership
  - Issue access token (JWT) + refresh token (stored in `refresh_tokens`)
  - Returns `{ accessToken, refreshToken, member }`
  - Span: `verify-magic-link`

- `src/domain/services/auth/refresh-token-service.ts`
  - Accepts `refreshToken`
  - Validate token exists, not expired, not revoked
  - Issue new access token
  - Returns `{ accessToken }`
  - Span: `refresh-token`

- `src/domain/services/auth/revoke-token-service.ts`
  - Accepts `refreshToken`
  - Sets `revokedAt = now()`
  - Used for logout
  - Span: `revoke-token`

### 2.5 Repositories
- `src/infra/db/repositories/magic-link-tokens-repository.ts`
  - `insertMagicLinkToken(params)`
  - `findByToken(token)` — returns token record or null
  - `markAsUsed(id)`

- `src/infra/db/repositories/refresh-tokens-repository.ts`
  - `insertRefreshToken(params)`
  - `findByToken(token)`
  - `revokeToken(id)`

### 2.6 Middleware
- `src/infra/http/middlewares/jwt-auth.ts`
  - Fastify `preHandler` hook — validates `Authorization: Bearer <jwt>`
  - Attaches decoded `{ memberId }` to `request.user`
  - Replaces current `api-key-auth.ts` (keep the file but deprecate for bot-only use)

### 2.7 HTTP layer
Routes under `src/infra/http/routes/auth-routes.ts`:
- `POST /auth/magic-link` — body: `{ email }` → calls `requestMagicLink`
- `POST /auth/verify` — body: `{ token }` → calls `verifyMagicLink` → returns tokens
- `POST /auth/refresh` — body: `{ refreshToken }` → returns new access token
- `POST /auth/logout` — body: `{ refreshToken }` → revokes token

### 2.8 Error classes
- `src/domain/errors/invalid-token.ts`
- `src/domain/errors/token-expired.ts`

### 2.9 Tests
- Unit: `request-magic-link-service.spec.ts` — mock email service, verify token created
- Unit: `verify-magic-link-service.spec.ts` — valid token, expired token, already used token
- Unit: `refresh-token-service.spec.ts` — valid refresh, expired, revoked
- Integration: `auth-controller.spec.ts` — full flow through HTTP layer

---

## Phase 3 — Workspace & Integration Layer

> Replace the old `platform`/`platformId` on workspaces with the new `workspace_integrations` table. Members resolve their platform identity through `member_platform_identities`.

### 3.1 Entities
- `src/domain/entities/workspace-integration.ts`
- `src/domain/entities/member-platform-identity.ts`

### 3.2 Domain errors
- `src/domain/errors/integration-not-found.ts`
- `src/domain/errors/integration-already-exists.ts`
- `src/domain/errors/identity-already-exists.ts`

### 3.3 Repositories
- `src/infra/db/repositories/workspace-integrations-repository.ts`
  - `insertWorkspaceIntegration(params)`
  - `findByProviderAndProviderId(provider, providerId)` — returns integration or null
  - `findWorkspaceByIntegration(provider, providerId)` — JOIN → returns workspace or null

- `src/infra/db/repositories/member-platform-identities-repository.ts`
  - `insertMemberPlatformIdentity(params)`
  - `findMemberByProviderIdentity(provider, providerUserId)` — JOIN → returns member or null

- Update `src/infra/db/repositories/workspaces-repository.ts`
  - Remove `findByPlatformId`
  - Remove `platform`/`platformId` from insert params
  - Add `findByOwnerId(memberId)` — returns member's workspace

### 3.4 Domain services
- `src/domain/services/workspace-integrations/create-workspace-integration-service.ts`
  - Wraps insert, handles unique violation → `IntegrationAlreadyExists`
  - Span: `create-workspace-integration`

- `src/domain/services/workspace-integrations/get-workspace-by-integration-service.ts`
  - Calls `findWorkspaceByIntegration`
  - Returns `WorkspaceNotFound` if missing
  - Span: `get-workspace-by-integration`

- Update `src/domain/services/workspace/create-workspace-service.ts`
  - Remove `platform`/`platformId` params
  - Accept `ownerId` (from JWT `request.user.memberId`)
  - After creating workspace, auto-create membership for owner

- Update `src/domain/services/members/find-member-by-platform-service.ts`
  - Replace `discordUserId` lookup on members with `findMemberByProviderIdentity`

### 3.5 HTTP layer
- `POST /workspaces` — create workspace (JWT auth), body: `{ name, description? }`
- `POST /workspaces/:id/integrations` — add integration (JWT auth), body: `{ provider, providerId }`
- `GET /workspaces/by-integration` — query: `{ provider, providerId }` — used by Discord bot (API key auth)
- `GET /workspaces/:id` — get workspace by id (JWT auth)

Update existing workspace routes to use new services. Keep API key auth on bot-facing routes.

### 3.6 Tests
- Unit: `create-workspace-integration-service.spec.ts`
- Unit: `get-workspace-by-integration-service.spec.ts`
- Integration: `workspace-integrations-controller.spec.ts`

---

## Phase 4 — Async Bookmark Processing

> Bookmarks are saved immediately with `status: submitted`, then enriched in the background (fire-and-forget). The HTTP response returns instantly.

### 4.1 Processing pipeline
Create `src/domain/services/bookmarks/process-bookmark-service.ts`:
- Accepts `bookmarkId`
- Sets status → `processing`
- Runs: scrape → summarize → generate title → generate tags → generate embedding
- On success: updates bookmark with all fields, sets status → `ready`
- On any failure: sets status → `failed` with an optional `failureReason` field
- Each step wrapped in a span
- **Not called directly by HTTP** — called via fire-and-forget

### 4.2 Fire-and-forget trigger
In `create-bookmark-service.ts`:
- Save bookmark immediately (status: `submitted`, url stored)
- Call `setImmediate(() => processBookmark(bookmarkId, services))` — does not block response
- Return bookmark id + status immediately

### 4.3 Retry endpoint
- `POST /bookmarks/:id/retry` — re-triggers processing for `failed` bookmarks
- Returns 409 if bookmark is not in `failed` state

### 4.4 Schema additions for processing
- Add `failureReason` text column to bookmarks (nullable) — set when status → `failed`

### 4.5 Tags generation
Extend `SummarizeService` port with `generateTags(text): Promise<string[] | DomainError>`:
- New method on `GemmaAdapter`
- Prompt: generate 3-5 short tags for the content, return as comma-separated list
- Parse response into `string[]`

### 4.6 Tests
- Unit: `process-bookmark-service.spec.ts` — mock all adapters, test state transitions
- Unit: `create-bookmark-service.spec.ts` — verify returns immediately with `submitted` status
- Integration: add retry endpoint test to `bookmarks-controller.spec.ts`

---

## Phase 5 — Search Improvements

> Return "matched because" explanations alongside search results. Deferred full implementation — scaffolded now, enabled when ready.

### 5.1 Explanation port
Add `explain(query: string, results: string[]): Promise<string[] | DomainError>` to `SummarizeService` port.

### 5.2 Gemma adapter
Implement `explain` on `GemmaAdapter`:
- Single batched prompt: given a search query and N result summaries, return N one-line explanations of why each matches
- Parse response into `string[]`

### 5.3 Search response shape
Update `getBookmarks` service to optionally return explanations:
- After fetching bookmarks, call `summarizeService.explain(text, summaries)`
- If explain fails, return results without explanations (non-blocking)
- Response item: `{ ...bookmark, matchedBecause?: string }`

### 5.4 Tests
- Unit: `get-bookmark-service.spec.ts` — test with explanation, test graceful fallback when explain fails

---

## Phase 6 — HTTP Layer Cleanup

> Audit and update all routes, schemas, and controllers to reflect the new domain model.

### 6.1 Breaking changes to fix
- `POST /bookmarks` — remove `platform`/`platformId`, use `workspaceId` directly (caller is authenticated)
- `GET /bookmarks` — same, plus add `status` filter (optional)
- `POST /members/create` — remove `discordUserId`, add optional `providerIdentity: { provider, providerUserId }`
- `GET /workspaces` — now `GET /workspaces/by-integration?provider=&providerId=` for bot use

### 6.2 New response fields
- Bookmarks: include `status`, `tags`, `matchedBecause?`
- Workspaces: include `isPublic`, `ownerId`

### 6.3 Auth split
- JWT-protected routes: workspace CRUD, bookmark CRUD, member profile
- API key routes: bot-facing endpoints (`/workspaces/by-integration`, `/bookmarks` via bot)
- Public routes: `GET /workspaces/:id` when `isPublic = true`

### 6.4 Swagger
- Update all schemas in `src/infra/http/schemas/`
- Ensure response schemas match new shapes

---

## Phase 7 — Tests & Quality Pass

> Final pass to ensure coverage and consistency.

### 7.1 Update test factories
- `make-workspace.ts` — remove `platform`/`platformId`, add `ownerId`, `isPublic`
- `make-member.ts` — remove `discordUserId`
- `make-bookmark.ts` — add `status`, `tags`
- New: `make-workspace-integration.ts`
- New: `make-member-platform-identity.ts`
- New: `make-magic-link-token.ts`

### 7.2 Update existing specs
All existing specs that use `platform`/`platformId`/`discordUserId` must be updated to the new model.

### 7.3 Coverage targets
- All domain services: unit tested
- All controllers: integration tested via `app.inject`
- Auth flow: full end-to-end test (request link → verify → access protected route)

---

## Execution Order

```
Phase 1  Schema completion
   ↓
Phase 2  Auth (JWT + magic link)
   ↓
Phase 3  Workspace & Integration layer
   ↓
Phase 4  Async bookmark processing + tags
   ↓
Phase 5  Search explanations
   ↓
Phase 6  HTTP layer cleanup
   ↓
Phase 7  Tests & quality pass
```

---

## Files to Delete / Retire

- `src/infra/http/middlewares/api-key-auth.ts` — keep but scope to bot-only routes
- `src/infra/db/repositories/workspaces-repository.ts` — remove `findByPlatformId`
- `src/domain/services/members/find-member-by-platform-service.ts` — update, don't delete

---

## Open Questions (for later)

- "Matched because" via Gemma: evaluate quality before enabling in production
- OAuth (Google, GitHub, Discord) — Phase 2 extension, not in this plan
- Replace fire-and-forget with pg-boss once the pipeline is stable
- Multi-workspace (MVP says out of scope)
- Discord bot update (separate phase after API is stable)
