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
# Start all services (frontend:3000, backend:8787)
./scripts/dev.sh

# Start individually
./scripts/dev-web.sh      # Frontend only
./scripts/dev-server.sh   # Backend only

# Frontend (in web/)
pnpm dev                  # Development with Turbopack
pnpm build                # Production build
pnpm lint                 # ESLint
pnpm pages:deploy         # Deploy to Cloudflare Pages

# Backend (in server/)
pnpm dev                  # Local Workers development
pnpm deploy               # Deploy to Cloudflare Workers
pnpm typecheck            # TypeScript check

# Database (in server/)
pnpm db:migrate:local     # Apply migrations locally
pnpm db:migrate:remote    # Apply migrations to production
```

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
NEXT_PUBLIC_API_URL=http://localhost:8787  # Dev
NEXT_PUBLIC_API_URL=https://api.index.ai   # Prod
```

### Backend Secrets (via wrangler secret put)
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

## Key Conventions

1. **All UI text must be in English** - code and user-facing content
2. **Strong typing required** - no `any` types, all data structures must be typed
3. **File size limits**: Max 300 lines per TypeScript file
4. **Directory limits**: Max 8 files per directory (create subdirectories if exceeded)
5. **ESM only** - no CommonJS modules
6. **Path aliases**: Use `@/` to import from `src/` in both web and server
