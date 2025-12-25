# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Index.ai is an AI-powered vertical knowledge portal - a full-stack monorepo with curated collections across programming, travel, fitness, and nutrition. It implements a RAG (Retrieval-Augmented Generation) pipeline with Claude API for chat and OpenAI for embeddings.

## Tech Stack

- **Frontend**: Next.js 15.1 + React 19 + Tailwind CSS v4 + next-intl (i18n)
- **Backend**: Cloudflare Workers + Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Vector Store**: Cloudflare Vectorize
- **Storage**: Cloudflare R2
- **Package Manager**: pnpm (required)

## Development Commands

```bash
# Start frontend (connects to remote backend)
./scripts/dev.sh

# Frontend (in web/)
pnpm dev                  # Development with Turbopack
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm pages:deploy         # Deploy to Cloudflare Pages

# Backend (in server/) - deploy only, no local development
pnpm run deploy           # Deploy to Cloudflare Workers
pnpm typecheck            # TypeScript check
pnpm db:migrate:remote    # Apply migrations to production
```

## Development Server Rules

- **Frontend dev server MUST run on port 3000** - CORS only allows localhost:3000
- If port 3000 is occupied, kill the process and restart:
  ```bash
  lsof -ti:3000 | xargs kill -9 && cd web && pnpm dev
  ```
- Never add additional localhost ports to CORS config

## Project Structure

```
index.ai/
├── web/                  # Next.js frontend
│   └── src/
│       ├── app/          # App Router pages (i18n-aware: /[locale]/...)
│       ├── components/   # React components (chat/, layout/, providers/)
│       ├── i18n/         # Internationalization config
│       ├── messages/     # Translation files (en/, zh/)
│       ├── lib/          # Utilities and API client
│       └── types/        # TypeScript interfaces
├── server/               # Cloudflare Workers backend
│   ├── src/
│   │   ├── routes/       # API endpoints (auth, channels, collections, chat)
│   │   ├── services/     # Business logic (embedding, retrieval, generation)
│   │   ├── middleware/   # JWT auth middleware
│   │   └── types/        # TypeScript interfaces
│   └── migrations/       # D1 SQL migrations
├── docs/                 # Official documentation
├── discuss/              # Design discussions
└── scripts/              # Development scripts
```

## Architecture

### API Structure
All API routes are versioned under `/api/v1/`:
- `/auth` - JWT authentication (register, login, refresh, me)
- `/channels` - Content category listing
- `/collections` - Document collection CRUD
- `/chat` - RAG query endpoint (supports streaming)

### Data Model
- **Channels**: Top-level categories (programming, travel, fitness, nutrition)
- **Collections**: Curated document sets within channels, each with a unique vector namespace
- **Documents**: Individual sources (PDF, URL, markdown) with processing status tracking
- **Comments**: BBS-style threaded discussions on collections

### RAG Pipeline
1. Document ingestion -> chunking -> embedding (OpenAI text-embedding-3-large)
2. Query -> vector search (Cloudflare Vectorize) -> relevant chunks
3. Chunks + query -> Claude API -> grounded response with citations

### Internationalization
- Supported locales: `en` (default), `zh`
- Translation files in `web/src/messages/{locale}/`
- Route structure: `/[locale]/...` with next-intl middleware

## Environment Configuration

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=https://api.index.ai   # Always connects to remote backend
```

### Backend Secrets (via wrangler secret put)
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

## Design Style

Design should lean towards **Xiaohongshu (RED)** style:
- Clean, minimalist aesthetic with generous whitespace
- Soft, rounded corners and pill-shaped buttons
- Card-based layouts with subtle shadows
- Friendly, approachable typography (Outfit for headings, Nunito for body)
- Serene sky blue color palette (#4A9EE8 accent)
- 4chan-style compact navigation for channels (emoji + name, separated by `/`)

## Key Conventions

1. **All UI text must be in English** - code and user-facing content
2. **Strong typing required** - no `any` types, all data structures must be typed
3. **File size limits**: Max 300 lines per TypeScript file
4. **Directory limits**: Max 8 files per directory (create subdirectories if exceeded)
5. **ESM only** - no CommonJS modules
6. **Path aliases**: Use `@/` to import from `src/` in both web and server

## Naming Convention (snake_case vs camelCase)

This project uses a unified naming convention across the full stack:

| Layer | Convention | Example |
|-------|------------|---------|
| Database tables/columns | `snake_case` | `channel_id`, `created_at` |
| SQL queries | `snake_case` | `SELECT channel_id FROM collections` |
| API request/response JSON | `camelCase` | `{ "channelId": "...", "createdAt": "..." }` |
| TypeScript code (both frontend & backend) | `camelCase` | `const channelId = ...` |
| TypeScript types/interfaces | `PascalCase` for types, `camelCase` for properties | `interface Collection { channelId: string }` |

### Case Transformation

Use the utility functions in `server/src/utils/case-transform.ts`:

```typescript
import { toCamelCase, toSnakeCase } from "@/utils/case-transform";

// Database -> API response
const dbResult = await db.prepare("SELECT * FROM collections").all();
return c.json({ collections: toCamelCase(dbResult.results) });

// API request body -> Database insert
const body = await c.req.json();
const dbData = toSnakeCase(body);
```

**Important**: All API endpoints MUST transform database results to camelCase before returning to the frontend. The frontend should never receive snake_case keys.
