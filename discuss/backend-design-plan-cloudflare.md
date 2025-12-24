# Index.ai 后端开发计划（Cloudflare 全家桶版）

## 1. 为什么选择 Cloudflare

| 优势 | 说明 |
|------|------|
| **成本低** | 大部分服务有慷慨免费额度 |
| **边缘部署** | 全球 300+ 节点，延迟低 |
| **一站式** | 前后端 + 数据库 + 存储统一管理 |
| **开发体验** | Wrangler CLI 一键部署 |

---

## 2. 技术栈映射

| 需求 | 传统方案 | Cloudflare 方案 | 免费额度 |
|------|----------|-----------------|----------|
| 前端托管 | Vercel | **Pages** | 无限站点，500 次构建/月 |
| API 服务 | FastAPI | **Workers** | 10 万请求/天 |
| 长时任务 | Celery | **Containers** (Beta) | 按需付费 |
| 关系数据库 | PostgreSQL | **D1** (SQLite) | 5GB 存储，500 万行读/天 |
| 向量数据库 | Qdrant | **Vectorize** | 500 万向量查询/月 |
| 对象存储 | S3 | **R2** | 10GB 存储，无出口费 |
| 缓存 | Redis | **KV** | 10 万读/天 |
| 消息队列 | RabbitMQ | **Queues** | 100 万消息/月 |
| AI Gateway | - | **AI Gateway** | 免费（API 代理+缓存） |

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                      ┌──────────────┐         │
│  │    Pages     │  ←── Static ───────→ │    Users     │         │
│  │  (Frontend)  │                      │   Browser    │         │
│  └──────────────┘                      └──────────────┘         │
│         │                                     │                  │
│         │ API Calls                           │                  │
│         ▼                                     ▼                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Workers (API)                         │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │   │
│  │  │  Auth  │ │ Content│ │  Chat  │ │Purchase│             │   │
│  │  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘             │   │
│  └──────┼──────────┼──────────┼──────────┼──────────────────┘   │
│         │          │          │          │                       │
│  ┌──────▼──────────▼──────────▼──────────▼──────────────────┐   │
│  │                    Bindings                               │   │
│  │  ┌────┐ ┌──────────┐ ┌────┐ ┌────────┐ ┌──────┐          │   │
│  │  │ D1 │ │ Vectorize│ │ R2 │ │ Queues │ │  KV  │          │   │
│  │  └────┘ └──────────┘ └────┘ └────────┘ └──────┘          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │                    Containers                             │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │   │
│  │  │ Ingestion  │ │ Embedding  │ │ Newsletter │            │   │
│  │  │  Worker    │ │  Worker    │ │  Worker    │            │   │
│  │  └────────────┘ └────────────┘ └────────────┘            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                       External APIs                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  OpenAI  │ │  Claude  │ │  Stripe  │                         │
│  │(Embedding)│ │  (LLM)   │ │(Payment) │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
│         ▲                                                        │
│         └──────── AI Gateway (缓存 + 限流 + 日志) ───────────    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 服务职责

| 服务 | 职责 | 技术 |
|------|------|------|
| **Pages** | 前端 SPA 托管 | Next.js 静态导出 或 SSR |
| **Workers** | API 网关 + 轻量业务逻辑 | Hono / itty-router |
| **Containers** | 长时任务（文档解析、Embedding） | Python / Node |
| **D1** | 用户、频道、精选集等关系数据 | SQLite |
| **Vectorize** | 文档块向量存储 + 检索 | 原生支持 |
| **R2** | PDF/文档原文件存储 | S3 兼容 |
| **KV** | 会话、缓存、限流计数 | Key-Value |
| **Queues** | 异步任务队列（摄入、Embedding） | 消息队列 |
| **AI Gateway** | LLM API 代理（缓存、日志、限流） | 免费 |

---

## 4. Workers API 设计

### 4.1 技术选型

```typescript
// 使用 Hono 框架（轻量、类型安全、专为 Workers 设计）
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'

const app = new Hono<{ Bindings: Env }>()

app.use('/*', cors())
app.use('/api/*', jwt({ secret: 'your-secret' }))

// 路由
app.route('/api/v1/auth', authRouter)
app.route('/api/v1/channels', channelsRouter)
app.route('/api/v1/collections', collectionsRouter)
app.route('/api/v1/chat', chatRouter)
```

### 4.2 Bindings 类型定义

```typescript
// types/env.ts
interface Env {
  // D1 Database
  DB: D1Database

  // Vectorize Index
  VECTORIZE: VectorizeIndex

  // R2 Bucket
  DOCUMENTS: R2Bucket

  // KV Namespace
  CACHE: KVNamespace
  SESSIONS: KVNamespace

  // Queue
  INGESTION_QUEUE: Queue

  // AI Gateway
  AI: Ai

  // Secrets
  JWT_SECRET: string
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  STRIPE_SECRET_KEY: string
}
```

### 4.3 API 路由

```
Workers API (api.indexai.com)
├── /api/v1/auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   └── GET  /me
├── /api/v1/channels
│   ├── GET  /
│   └── GET  /:slug
├── /api/v1/collections
│   ├── GET  /
│   ├── GET  /:id
│   ├── POST /              (需登录)
│   ├── PUT  /:id           (需登录)
│   └── DELETE /:id         (需登录)
├── /api/v1/documents
│   ├── POST /upload        (需登录，触发 Queue)
│   ├── GET  /:id
│   └── DELETE /:id         (需登录)
├── /api/v1/chat
│   └── POST /query         (需登录 + 权限检查)
├── /api/v1/comments
│   ├── GET  /collection/:id
│   └── POST /              (需登录)
└── /api/v1/purchases
    ├── POST /create-checkout
    └── POST /webhook
```

---

## 5. 数据模型

### 5.1 D1 Schema (SQLite)

```sql
-- migrations/0001_initial.sql

-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  is_verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);

-- 频道表
CREATE TABLE channels (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_channels_slug ON channels(slug);

-- 精选集表
CREATE TABLE collections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  channel_id TEXT NOT NULL REFERENCES channels(id),
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  by TEXT NOT NULL,
  type TEXT CHECK(type IN ('official', 'user')) DEFAULT 'official',
  visibility TEXT CHECK(visibility IN ('public', 'private')) DEFAULT 'public',
  source_count INTEGER DEFAULT 0,
  vector_namespace TEXT UNIQUE NOT NULL,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_collections_channel ON collections(channel_id);
CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_slug ON collections(channel_id, slug);

-- 档案表
CREATE TABLE documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  collection_id TEXT NOT NULL REFERENCES collections(id),
  title TEXT NOT NULL,
  source_type TEXT CHECK(source_type IN ('pdf', 'url', 'markdown')) NOT NULL,
  source_url TEXT,
  r2_key TEXT,  -- R2 存储路径
  summary TEXT,
  chunk_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_documents_collection ON documents(collection_id);
CREATE INDEX idx_documents_status ON documents(status);

-- 购买表
CREATE TABLE purchases (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  scope TEXT CHECK(scope IN ('platform', 'channel')) NOT NULL,
  channel_id TEXT REFERENCES channels(id),
  type TEXT CHECK(type IN ('one_time', 'subscription')) DEFAULT 'one_time',
  amount INTEGER NOT NULL,  -- 金额（分）
  currency TEXT DEFAULT 'USD',
  payment_provider TEXT,
  payment_id TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_purchases_user ON purchases(user_id);

-- 评论表
CREATE TABLE comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  collection_id TEXT NOT NULL REFERENCES collections(id),
  parent_id TEXT REFERENCES comments(id),
  content TEXT NOT NULL,
  is_deleted INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_collection ON comments(collection_id);
```

### 5.2 Vectorize 结构

```typescript
// Vectorize 索引配置
{
  name: "index-ai-chunks",
  dimensions: 3072,  // text-embedding-3-large
  metric: "cosine"
}

// Vector Metadata
interface ChunkMetadata {
  document_id: string
  collection_id: string
  namespace: string      // 用于过滤
  content: string        // 原文（用于返回）
  page?: number
  section?: string
}

// 插入向量
await env.VECTORIZE.insert([{
  id: chunkId,
  values: embedding,
  metadata: {
    document_id: "xxx",
    collection_id: "xxx",
    namespace: "prog-ai_deepseek",
    content: "chunk 文本...",
    page: 3
  }
}])

// 检索（带 namespace 过滤）
const results = await env.VECTORIZE.query(queryEmbedding, {
  topK: 10,
  filter: { namespace: "prog-ai_deepseek" },
  returnMetadata: true
})
```

---

## 6. Containers 长时任务

### 6.1 为什么需要 Containers

Workers 有 CPU 时间限制（免费 10ms，付费 30s），不适合：
- PDF 解析（可能需要几秒）
- 批量 Embedding（大文档）
- 周报生成

**Containers** 是 Cloudflare 新推出的容器服务，适合这些场景。

### 6.2 任务流程

```
┌─────────────────────────────────────────────────────────────────┐
│  文档摄入流程                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. 用户上传文档                                                 │
│     └── Workers 接收 → 存入 R2 → 发送消息到 Queue               │
│                                                                  │
│  2. Container 消费队列                                           │
│     └── 从 R2 读取文件 → 解析 → 分块 → Embedding → 存入 Vectorize │
│                                                                  │
│  3. 更新状态                                                     │
│     └── Container 完成后更新 D1 中的 document.status             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Container 代码示例

```python
# containers/ingestion/main.py

import asyncio
from cloudflare import Cloudflare
from unstructured.partition.auto import partition

async def process_document(message: dict):
    """处理单个文档"""
    document_id = message["document_id"]
    r2_key = message["r2_key"]
    namespace = message["namespace"]

    # 1. 从 R2 下载文件
    cf = Cloudflare()
    file_content = await cf.r2.get(bucket="documents", key=r2_key)

    # 2. 解析文档
    elements = partition(file=file_content)
    text = "\n".join([el.text for el in elements])

    # 3. 分块
    chunks = chunk_text(text, chunk_size=512, overlap=50)

    # 4. Embedding
    embeddings = await get_embeddings(chunks)

    # 5. 存入 Vectorize
    vectors = [
        {
            "id": f"{document_id}_{i}",
            "values": emb,
            "metadata": {
                "document_id": document_id,
                "namespace": namespace,
                "content": chunk,
            }
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    await cf.vectorize.insert(index="index-ai-chunks", vectors=vectors)

    # 6. 更新 D1
    await cf.d1.run(
        database="indexai",
        sql="UPDATE documents SET status = 'completed', chunk_count = ? WHERE id = ?",
        params=[len(chunks), document_id]
    )

async def main():
    """消费队列"""
    cf = Cloudflare()
    while True:
        messages = await cf.queues.pull(queue="ingestion-queue", batch_size=10)
        for msg in messages:
            try:
                await process_document(msg.body)
                await msg.ack()
            except Exception as e:
                print(f"Error: {e}")
                await msg.retry()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 7. AI Gateway 配置

### 7.1 为什么用 AI Gateway

| 功能 | 说明 |
|------|------|
| **统一入口** | 代理 OpenAI/Anthropic API |
| **缓存** | 相同请求自动缓存，省钱 |
| **限流** | 防止滥用 |
| **日志** | 记录所有 AI 调用 |
| **Fallback** | 主 API 失败时切换备用 |

### 7.2 使用示例

```typescript
// 通过 AI Gateway 调用 Claude
const response = await fetch(
  `https://gateway.ai.cloudflare.com/v1/${accountId}/index-ai/anthropic/messages`,
  {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  }
)
```

---

## 8. 目录结构

```
server/
├── workers/                     # Cloudflare Workers
│   ├── api/                     # 主 API Worker
│   │   ├── src/
│   │   │   ├── index.ts         # 入口
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── channels.ts
│   │   │   │   ├── collections.ts
│   │   │   │   ├── documents.ts
│   │   │   │   ├── chat.ts
│   │   │   │   ├── comments.ts
│   │   │   │   └── purchases.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── retrieval.ts
│   │   │   │   └── generation.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── rateLimit.ts
│   │   │   └── types/
│   │   │       └── env.ts
│   │   ├── wrangler.toml
│   │   └── package.json
│   └── migrations/              # D1 迁移文件
│       ├── 0001_initial.sql
│       └── 0002_xxx.sql
├── containers/                  # Cloudflare Containers
│   ├── ingestion/
│   │   ├── main.py
│   │   ├── parser.py
│   │   ├── chunker.py
│   │   ├── embedder.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── newsletter/
│       ├── main.py
│       └── Dockerfile
├── shared/                      # 共享类型/工具
│   └── types/
│       └── index.ts
└── scripts/
    ├── deploy.sh
    ├── migrate.sh
    └── seed.sh
```

---

## 9. wrangler.toml 配置

```toml
# workers/api/wrangler.toml

name = "index-ai-api"
main = "src/index.ts"
compatibility_date = "2024-12-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "indexai"
database_id = "xxx"

# Vectorize
[[vectorize]]
binding = "VECTORIZE"
index_name = "index-ai-chunks"

# R2 Bucket
[[r2_buckets]]
binding = "DOCUMENTS"
bucket_name = "index-ai-documents"

# KV Namespaces
[[kv_namespaces]]
binding = "CACHE"
id = "xxx"

[[kv_namespaces]]
binding = "SESSIONS"
id = "xxx"

# Queues
[[queues.producers]]
binding = "INGESTION_QUEUE"
queue = "ingestion-queue"

# AI Gateway
[ai]
binding = "AI"

# Environment Variables
[vars]
ENVIRONMENT = "production"

# Secrets (通过 wrangler secret put 设置)
# JWT_SECRET
# OPENAI_API_KEY
# ANTHROPIC_API_KEY
# STRIPE_SECRET_KEY
```

---

## 10. 开发阶段

### Phase 1: 基础框架

| 任务 | 说明 |
|------|------|
| Workers 项目初始化 | Hono + TypeScript + wrangler |
| D1 Schema | 创建表结构 + 迁移 |
| 基础 CRUD | 频道、精选集 API |
| Pages 部署 | 前端托管配置 |

### Phase 2: 存储集成

| 任务 | 说明 |
|------|------|
| R2 集成 | 文档上传/下载 |
| Vectorize 集成 | 向量存储/检索 |
| KV 缓存 | 热点数据缓存 |

### Phase 3: RAG 核心

| 任务 | 说明 |
|------|------|
| Queues 配置 | 异步任务队列 |
| Container 部署 | 文档摄入服务 |
| AI Gateway | LLM 调用代理 |
| Chat API | 检索 + 生成 |

### Phase 4: 用户系统

| 任务 | 说明 |
|------|------|
| 认证 | 注册/登录/JWT |
| 权限 | 精选集访问控制 |
| UGC | 用户创建精选集 |

### Phase 5: 支付

| 任务 | 说明 |
|------|------|
| Stripe 集成 | Checkout + Webhook |
| 购买逻辑 | 通行证管理 |

---

## 11. 成本估算

### 免费额度（足够 MVP）

| 服务 | 免费额度 | 预估使用 |
|------|----------|----------|
| Pages | 无限站点 | 1 站点 |
| Workers | 10 万请求/天 | ~1 万/天 |
| D1 | 500 万行读/天 | ~10 万/天 |
| Vectorize | 500 万查询/月 | ~10 万/月 |
| R2 | 10GB 存储 | ~1GB |
| KV | 10 万读/天 | ~5 万/天 |
| Queues | 100 万消息/月 | ~1 万/月 |
| AI Gateway | 免费 | 无限 |

### 付费预估（规模化后）

| 服务 | 单价 | 预估月费 |
|------|------|----------|
| Workers Paid | $5/月 + 用量 | ~$10 |
| D1 Paid | $0.75/百万读 | ~$5 |
| Vectorize | $0.01/千查询 | ~$10 |
| R2 | $0.015/GB | ~$1 |
| Containers | 按用量 | ~$20 |
| **总计** | | **~$50/月** |

---

## 12. 待确认问题

1. **Containers 可用性**：目前 Beta，是否稳定？需要申请 waitlist？
2. **Vectorize 限制**：单索引最大向量数？维度限制？
3. **D1 性能**：SQLite 对复杂查询的支持？
4. **前端部署**：Pages 用静态导出还是 Workers SSR？
5. **域名**：使用自定义域名还是 *.pages.dev？

---

## 13. 对比：Cloudflare vs 传统方案

| 维度 | Cloudflare | 传统方案 |
|------|------------|----------|
| **启动成本** | $0 (免费额度内) | ~$50/月起 |
| **运维复杂度** | 低（托管服务） | 中（需管理多服务） |
| **扩展性** | 自动扩展 | 需手动配置 |
| **延迟** | 边缘部署，全球快 | 单区域 |
| **学习曲线** | 中（新概念） | 低（熟悉的技术） |
| **生态成熟度** | 较新 | 成熟 |
| **迁移成本** | 有锁定风险 | 标准化，易迁移 |

**结论**：MVP 阶段强烈推荐 Cloudflare 全家桶，成本低、部署快。规模化后如有需要可迁移。
