#!/bin/bash

# Index.ai Cloudflare Setup Script
# Run this script to create all necessary Cloudflare resources

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo "================================================"
echo "  Index.ai Cloudflare Setup"
echo "================================================"
echo ""

# Check if wrangler is logged in
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare first:"
    wrangler login
fi

echo ""
echo "Creating Cloudflare resources..."
echo ""

# 1. Create D1 Database
echo "[1/4] Creating D1 Database..."
D1_OUTPUT=$(wrangler d1 create indexai 2>&1) || true

if echo "$D1_OUTPUT" | grep -q "already exists"; then
    echo "  D1 database 'indexai' already exists"
    D1_ID=$(wrangler d1 list | grep indexai | awk '{print $1}')
else
    D1_ID=$(echo "$D1_OUTPUT" | grep "database_id" | awk -F'"' '{print $2}')
    echo "  Created D1 database with ID: $D1_ID"
fi

# 2. Create R2 Bucket
echo "[2/4] Creating R2 Bucket..."
R2_OUTPUT=$(wrangler r2 bucket create index-ai-documents 2>&1) || true

if echo "$R2_OUTPUT" | grep -q "already exists"; then
    echo "  R2 bucket 'index-ai-documents' already exists"
else
    echo "  Created R2 bucket 'index-ai-documents'"
fi

# 3. Create KV Namespaces
echo "[3/4] Creating KV Namespaces..."

CACHE_OUTPUT=$(wrangler kv namespace create CACHE 2>&1) || true
if echo "$CACHE_OUTPUT" | grep -q "already exists"; then
    echo "  KV namespace 'CACHE' already exists"
    CACHE_ID=$(wrangler kv namespace list | grep -A1 "index-ai-api-CACHE" | grep "id" | awk -F'"' '{print $2}')
else
    CACHE_ID=$(echo "$CACHE_OUTPUT" | grep "id" | head -1 | awk -F'"' '{print $2}')
    echo "  Created KV namespace 'CACHE' with ID: $CACHE_ID"
fi

SESSIONS_OUTPUT=$(wrangler kv namespace create SESSIONS 2>&1) || true
if echo "$SESSIONS_OUTPUT" | grep -q "already exists"; then
    echo "  KV namespace 'SESSIONS' already exists"
    SESSIONS_ID=$(wrangler kv namespace list | grep -A1 "index-ai-api-SESSIONS" | grep "id" | awk -F'"' '{print $2}')
else
    SESSIONS_ID=$(echo "$SESSIONS_OUTPUT" | grep "id" | head -1 | awk -F'"' '{print $2}')
    echo "  Created KV namespace 'SESSIONS' with ID: $SESSIONS_ID"
fi

# 4. Create Vectorize Index
echo "[4/4] Creating Vectorize Index..."
VECTORIZE_OUTPUT=$(wrangler vectorize create index-ai-chunks --dimensions=3072 --metric=cosine 2>&1) || true

if echo "$VECTORIZE_OUTPUT" | grep -q "already exists"; then
    echo "  Vectorize index 'index-ai-chunks' already exists"
else
    echo "  Created Vectorize index 'index-ai-chunks'"
fi

echo ""
echo "================================================"
echo "  Setup Complete!"
echo "================================================"
echo ""
echo "Please update server/wrangler.toml with these values:"
echo ""
echo "[[d1_databases]]"
echo "binding = \"DB\""
echo "database_name = \"indexai\""
echo "database_id = \"$D1_ID\""
echo ""
echo "[[r2_buckets]]"
echo "binding = \"DOCUMENTS\""
echo "bucket_name = \"index-ai-documents\""
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"CACHE\""
echo "id = \"$CACHE_ID\""
echo ""
echo "[[kv_namespaces]]"
echo "binding = \"SESSIONS\""
echo "id = \"$SESSIONS_ID\""
echo ""
echo "[[vectorize]]"
echo "binding = \"VECTORIZE\""
echo "index_name = \"index-ai-chunks\""
echo ""
echo "Next steps:"
echo "  1. Update wrangler.toml with the values above"
echo "  2. Run: cd server && pnpm db:migrate:local"
echo "  3. Set secrets: wrangler secret put JWT_SECRET"
echo "  4. Set secrets: wrangler secret put OPENAI_API_KEY"
echo "  5. Set secrets: wrangler secret put ANTHROPIC_API_KEY"
echo ""
