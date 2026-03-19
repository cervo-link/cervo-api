# Cervo — MVP Design Spec

## Core Concept

Cervo (from Portuguese "Acervo") is a semantic bookmark manager. You save a URL, Cervo understands what it's about, and you find it later by describing what you're looking for — not by remembering the exact title or URL.

**The core loop:**

1. **Save** — paste a URL from anywhere (web, Discord, future integrations)
2. **Enrich** — Cervo scrapes the page and AI-generates a readable title, description, and tags
3. **Find** — type what you're thinking about, Cervo returns the right link with an explanation of why it matched

What makes it different from regular bookmarks: you search by *meaning*, not keywords. You saved a blog post about "why startups fail at hiring" three months ago — you type "recruiting mistakes" and Cervo finds it, even though those words don't appear in the URL or title.

---

## User Flow & Pages

### Auth

- Sign in via magic link (email) or OAuth (Google, GitHub, Discord)
- First login auto-creates your personal workspace

### Home (Workspace)

- Centered search/save input — the single entry point for everything
- URL detection: input is treated as a URL if it starts with `http://` or `https://`, or matches a pattern like `domain.tld/...` (e.g., `github.com/user/repo`). Everything else is a search query.
- When detected as a URL, saving triggers on submit (Enter)
- When detected as a search query, search triggers as you type (debounced)
- Below the input (when empty/focused): recent search history — clickable to re-run
- Below search history: list of saved links (most recent first)
- Each link in the list shows: generated title, tags, status (processing/ready/failed)

### Search Results

- Ranked list showing: title, description snippet, tags, URL
- Each result includes a short "matched because: ..." explanation showing why Cervo thinks this is what you were looking for (AI-generated at query time)

### Link Detail Page

- Accessible by clicking any link from the list or search results
- Shows: generated title (editable), description (editable), tags (editable), original URL with copy/open buttons
- Block editor for the description. Supported block types: headings (h1-h3), paragraphs, bullet lists, numbered lists, inline formatting (bold, italic, inline code, links). No images, embeds, code blocks, or tables in MVP.
- Delete link button
- Retry processing button (visible when status is "failed")

### Workspace Settings

- Toggle workspace between private and public (public = read-only for non-members)
- Invite members by email
- Members can view and save links; owner can manage settings

---

## Link Lifecycle & States

### States

1. **Submitted** — URL received, saved to DB, queued for processing
2. **Processing** — worker is scraping and generating content
3. **Ready** — title, description, tags, and search embedding all generated
4. **Failed** — scraping or AI generation failed (e.g., page is behind a login wall, site is down). The URL is still saved — user sees the raw URL and can manually retry from the detail page.

### Display by State

- **Submitted / Processing** — list shows the raw URL as the title, a spinner/loading indicator, and no tags. Detail page shows the URL and a "processing..." message.
- **Ready** — list shows generated title, tags. Detail page shows full generated content.
- **Failed** — list shows raw URL with a "failed" badge. Detail page shows the URL + retry button.

### User Actions on Links

- **Create** — paste URL via web input or Discord command/channel watch
- **Read** — view in list, search results, or detail page
- **Update** — edit title, description, tags on the detail page via block editor
- **Delete** — owner can delete any link. Members can delete only their own links. Permanent, no trash/undo for MVP.

### Duplicate URLs

- If a URL already exists in the workspace, the save is rejected and the user is notified ("This link is already saved") with a link to the existing entry. Applies to both web and Discord saves.

### Processing Rules

- If user edits the generated content, their edits are the source of truth — Cervo never overwrites user edits
- If user edits a link while it's still processing, the worker skips writing any field the user has already edited and only fills in fields that are still empty
- Manual retry on failed links re-runs the full scraping + AI pipeline. Retry is only available for "Failed" links, not links currently in "Processing" state.
- No maximum retry count for MVP

---

## Search Behavior

### Semantic Search

- Searches against the vector embeddings generated from each link's title + description + tags
- Links in Submitted/Processing/Failed states have no embeddings and are not included in semantic search results. Users can still find them by scrolling the main link list.
- Returns results ranked by relevance
- Each result shows a "matched because: ..." line explaining the connection. Generated via a single LLM call for the top 5 results (batched, not per-result). Results render immediately; explanations stream in or appear once ready. If the LLM is slow/unavailable, results show without explanations.

### Search History

- Displayed below the input when empty/focused
- Shows recent queries, clickable to re-run

### Search Scope

- Searches only within the current workspace
- For public workspaces, visitors can search too (read-only). Rate limited to prevent abuse (e.g., 10 searches/minute for unauthenticated visitors).
- Discord `/cervo search` hits the same search logic, returns top 3

### NOT in MVP

- No filters (by tag, date, etc.) — just semantic search
- No saved searches
- No full-text keyword search fallback (pure semantic)

---

## Workspace & Sharing Model

### Ownership

- Every user gets a personal workspace on first sign-in
- One workspace per user for MVP (no multi-workspace)

### Privacy

- Workspace defaults to private (only owner sees links)
- Owner can toggle to public — public means anyone with the workspace URL can browse and search links (read-only)
- Toggle lives in workspace settings

### Members

- Owner invites members by email
- Members can: view all links, save new links, search, delete their own links, edit their own links
- Members cannot: delete or edit other people's links, change workspace settings, invite others
- Only the owner manages settings and invitations
- Every link stores a `createdBy` field to enforce ownership-based permissions

### Sharing

- Public workspaces have a shareable URL (e.g., `cervo.app/w/username`)
- No individual link sharing — all-or-nothing at the workspace level

---

## Discord Integration

### Setup

- User runs `/cervo connect` in Discord — bot responds with a browser link
- User authenticates in browser, which binds their Discord account to their Cervo workspace
- One-time process, stays connected

### Saving Links

- `/cervo save <url>` — intentionally saves a URL to your workspace
- Channel watch: `/cervo watch #channel` — bot auto-saves any URL posted in that channel. `/cervo unwatch #channel` to stop. If a message contains multiple URLs, all are saved. URLs in embeds or edited messages are ignored for MVP — only plain-text URLs in new messages.
- Bot confirms: "Saved! Processing..." with optional follow-up when enrichment completes
- Rate limit: max 50 links/day per workspace via Discord to prevent spam/abuse

### Retrieving

- `/cervo search <query>` — semantic search from Discord, returns top 3 results with titles and links to the Cervo detail page

### MVP Boundaries

- No editing from Discord — edit/delete only through the web
- No workspace management from Discord — settings, invites, privacy all through the web
- One workspace per Discord account binding (no switching workspaces from Discord)

---

## Tags

- Tags are freeform strings, AI-generated during processing
- Users can edit, add, or remove tags on the detail page
- Tags are workspace-scoped (no global tag vocabulary)
- Tags are displayed on links in the list and search results but are not independently filterable in MVP (search catches them via embeddings)

---

## MVP Feature Summary

### In Scope

- Magic link + OAuth auth (Google, GitHub, Discord)
- Personal workspace (auto-created)
- Unified search/save input with search history
- Link saving with background scraping + AI enrichment
- Semantic search with "matched because" explanations
- Link detail page with block editor (headings, paragraphs, lists, bold/italic, inline code, links)
- Link CRUD (create, read, update, delete)
- Duplicate URL detection
- Retry failed processing
- Workspace privacy toggle (private/public read-only)
- Member invitations (view + save permissions, own-link edit/delete)
- Discord bot (connect, save, watch/unwatch channel, search)
- Rate limiting (public search, Discord saves)
- Web platform

### Out of Scope (Future)

- Multi-workspace
- Individual link sharing
- Search filters (by tag, date)
- Full-text keyword search fallback
- Rich editor features (images, embeds, code blocks, tables)
- Trash/undo for deleted links
- Slack, mobile app, Raycast, WhatsApp, Telegram integrations
- Workspace roles beyond owner/member
- Analytics or link click tracking