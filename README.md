# Index.ai

AI-powered vertical knowledge portal. Curated collections across programming, travel, fitness, and nutrition.

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS v4
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQLite)
- **Vector Store**: Cloudflare Vectorize
- **Storage**: Cloudflare R2
- **LLM**: Claude API (via AI Gateway)
- **Embedding**: OpenAI text-embedding-3-large

## Project Structure

```
index.ai/
├── web/                 # Next.js frontend
├── server/              # Cloudflare Workers backend
├── docs/                # Documentation
├── discuss/             # Design discussions
└── scripts/             # Development scripts
```

## Development

### Prerequisites

- Node.js 20+
- pnpm
- Wrangler CLI (`pnpm add -g wrangler`)

### Setup

```bash
# Install dependencies
cd web && pnpm install
cd ../server && pnpm install

# Start development servers
./scripts/dev.sh

# Or start individually
./scripts/dev-web.sh    # Frontend on port 3000
./scripts/dev-server.sh # Backend on port 8787
```

### Database

```bash
cd server

# Create D1 database (first time)
wrangler d1 create indexai

# Run migrations locally
pnpm db:migrate:local

# Run migrations on production
pnpm db:migrate:remote
```

## Deployment

### Frontend (Cloudflare Pages)

```bash
cd web
pnpm pages:deploy
```

### Backend (Cloudflare Workers)

```bash
cd server
pnpm deploy
```

## License

Private
