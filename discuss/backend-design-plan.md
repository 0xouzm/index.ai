# Index.ai 后端开发计划

## 1. 技术栈

### 1.1 核心框架

| 技术 | 版本 | 说明 |
|------|------|------|
| Python | 3.12+ | 运行时 |
| FastAPI | 0.115+ | Web 框架 |
| Pydantic | 2.x | 数据验证 |
| SQLAlchemy | 2.x | ORM |
| uv | latest | 包管理 |

### 1.2 数据存储

| 技术 | 用途 | 部署方式 |
|------|------|----------|
| PostgreSQL | 关系数据（用户、频道、精选集等） | Docker / 云服务 |
| Qdrant | 向量存储（文档 Embedding） | Docker / 云服务 |
| Redis | 缓存、会话、任务队列 | Docker / 云服务 |

### 1.3 AI/ML

| 技术 | 用途 |
|------|------|
| OpenAI API | Embedding (text-embedding-3-large) |
| Claude API | 生成层 (claude-sonnet) |
| Tavily / SerpAPI | 联网检索（降级场景） |

### 1.4 其他依赖

| 库 | 用途 |
|------|------|
| `asyncpg` | PostgreSQL 异步驱动 |
| `qdrant-client` | Qdrant Python SDK |
| `httpx` | 异步 HTTP 客户端 |
| `python-jose` | JWT 处理 |
| `passlib[bcrypt]` | 密码哈希 |
| `celery` / `arq` | 后台任务 |
| `unstructured` | 文档解析（PDF/HTML） |
| `tiktoken` | Token 计数 |

---

## 2. 系统架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                        (FastAPI + Uvicorn)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth       │  │   Content    │  │   Chat       │           │
│  │   Service    │  │   Service    │  │   Service    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
├─────────┼─────────────────┼─────────────────┼────────────────────┤
│         │                 │                 │                    │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐           │
│  │  PostgreSQL  │  │    Qdrant    │  │    Redis     │           │
│  │  (关系数据)   │  │  (向量数据)   │  │  (缓存/队列) │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      Background Workers                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Ingestion   │  │  Embedding   │  │  Newsletter  │           │
│  │  Worker      │  │  Worker      │  │  Worker      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分

```
┌─────────────────────────────────────────────────────────────────┐
│  API Layer                                                       │
│  ├── /api/v1/auth      认证相关                                  │
│  ├── /api/v1/channels  频道 CRUD                                 │
│  ├── /api/v1/collections  精选集 CRUD                            │
│  ├── /api/v1/documents 档案 CRUD                                 │
│  ├── /api/v1/chat      AI 对话                                   │
│  ├── /api/v1/comments  评论系统                                  │
│  └── /api/v1/purchases 购买系统                                  │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                   │
│  ├── auth_service      用户认证、权限校验                        │
│  ├── channel_service   频道业务逻辑                              │
│  ├── collection_service 精选集业务逻辑                           │
│  ├── document_service  档案处理                                  │
│  ├── ingestion_service 文档摄入（解析、分块）                    │
│  ├── embedding_service 向量化                                    │
│  ├── retrieval_service 检索（向量 + BM25）                       │
│  ├── generation_service LLM 生成（带 Citation）                  │
│  ├── chat_service      对话管理                                  │
│  └── purchase_service  购买逻辑                                  │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                      │
│  ├── models/           SQLAlchemy 模型                           │
│  ├── repositories/     数据访问层                                │
│  └── schemas/          Pydantic 模式                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型

### 3.1 PostgreSQL 模型

```python
# models/channel.py
class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    collections: Mapped[list["Collection"]] = relationship(back_populates="channel")


# models/collection.py
class CollectionType(str, Enum):
    OFFICIAL = "official"
    USER = "user"

class CollectionVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    channel_id: Mapped[UUID] = mapped_column(ForeignKey("channels.id"))
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"))  # UGC 时有值

    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(200), index=True)
    by: Mapped[str] = mapped_column(String(100))  # "Index.ai" 或用户名
    type: Mapped[CollectionType] = mapped_column(default=CollectionType.OFFICIAL)
    visibility: Mapped[CollectionVisibility] = mapped_column(default=CollectionVisibility.PUBLIC)
    source_count: Mapped[int] = mapped_column(default=0)
    vector_namespace: Mapped[str] = mapped_column(String(100), unique=True)

    summary: Mapped[str | None] = mapped_column(Text)  # AI 生成的摘要

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    channel: Mapped["Channel"] = relationship(back_populates="collections")
    documents: Mapped[list["Document"]] = relationship(back_populates="collection")
    user: Mapped["User | None"] = relationship(back_populates="collections")


# models/document.py
class SourceType(str, Enum):
    PDF = "pdf"
    URL = "url"
    MARKDOWN = "markdown"

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    collection_id: Mapped[UUID] = mapped_column(ForeignKey("collections.id"))

    title: Mapped[str] = mapped_column(String(500))
    source_type: Mapped[SourceType]
    source_url: Mapped[str | None] = mapped_column(String(2000))
    file_path: Mapped[str | None] = mapped_column(String(500))  # 本地存储路径

    raw_content: Mapped[str | None] = mapped_column(Text)  # 原始文本
    summary: Mapped[str | None] = mapped_column(Text)  # AI 摘要

    chunk_count: Mapped[int] = mapped_column(default=0)
    token_count: Mapped[int] = mapped_column(default=0)

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    collection: Mapped["Collection"] = relationship(back_populates="documents")


# models/user.py
class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    collections: Mapped[list["Collection"]] = relationship(back_populates="user")
    purchases: Mapped[list["Purchase"]] = relationship(back_populates="user")


# models/purchase.py
class PurchaseScope(str, Enum):
    PLATFORM = "platform"
    CHANNEL = "channel"

class PurchaseType(str, Enum):
    ONE_TIME = "one_time"
    SUBSCRIPTION = "subscription"  # 预留

class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))

    scope: Mapped[PurchaseScope]
    channel_id: Mapped[UUID | None] = mapped_column(ForeignKey("channels.id"))  # scope=channel 时

    type: Mapped[PurchaseType] = mapped_column(default=PurchaseType.ONE_TIME)
    amount: Mapped[int] = mapped_column()  # 金额（分）
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    payment_provider: Mapped[str | None] = mapped_column(String(50))  # stripe, paddle 等
    payment_id: Mapped[str | None] = mapped_column(String(255))  # 外部支付 ID

    expires_at: Mapped[datetime | None] = mapped_column()  # 订阅到期时间（预留）

    created_at: Mapped[datetime] = mapped_column(default=func.now())

    user: Mapped["User"] = relationship(back_populates="purchases")
    channel: Mapped["Channel | None"] = relationship()


# models/comment.py
class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    collection_id: Mapped[UUID] = mapped_column(ForeignKey("collections.id"))
    parent_id: Mapped[UUID | None] = mapped_column(ForeignKey("comments.id"))  # 回复

    content: Mapped[str] = mapped_column(Text)

    is_deleted: Mapped[bool] = mapped_column(default=False)

    created_at: Mapped[datetime] = mapped_column(default=func.now())
    updated_at: Mapped[datetime] = mapped_column(default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship()
    collection: Mapped["Collection"] = relationship()
    replies: Mapped[list["Comment"]] = relationship()
```

### 3.2 Qdrant 向量结构

```python
# Qdrant Collection 配置
COLLECTION_NAME = "index_ai_chunks"

# 向量配置
vectors_config = VectorParams(
    size=3072,  # text-embedding-3-large 维度
    distance=Distance.COSINE
)

# Payload 结构
{
    "chunk_id": "uuid",
    "document_id": "uuid",
    "collection_id": "uuid",
    "namespace": "prog-ai_deepseek",  # 用于过滤
    "content": "chunk 文本内容",
    "metadata": {
        "page": 1,
        "section": "Introduction",
        "token_count": 256
    }
}
```

---

## 4. API 设计

### 4.1 认证 API

```
POST   /api/v1/auth/register     注册
POST   /api/v1/auth/login        登录（返回 JWT）
POST   /api/v1/auth/refresh      刷新 Token
POST   /api/v1/auth/logout       登出
GET    /api/v1/auth/me           获取当前用户
```

### 4.2 频道 API

```
GET    /api/v1/channels          获取所有频道
GET    /api/v1/channels/:slug    获取频道详情
```

### 4.3 精选集 API

```
GET    /api/v1/collections                      获取精选集列表（支持筛选）
GET    /api/v1/collections/:id                  获取精选集详情
POST   /api/v1/collections                      创建精选集（UGC，需登录）
PUT    /api/v1/collections/:id                  更新精选集（仅自己的）
DELETE /api/v1/collections/:id                  删除精选集（仅自己的）
GET    /api/v1/collections/:id/documents        获取精选集下的档案列表
```

### 4.4 档案 API

```
POST   /api/v1/documents                        上传档案（到指定精选集）
GET    /api/v1/documents/:id                    获取档案详情
DELETE /api/v1/documents/:id                    删除档案
POST   /api/v1/documents/:id/reprocess          重新处理档案（重新分块、向量化）
```

### 4.5 对话 API

```
POST   /api/v1/chat/query                       发起提问
  Request:
    {
      "collection_id": "uuid",
      "question": "这篇论文的核心创新是什么？",
      "document_ids": ["uuid", ...],  // 可选，限定范围
      "conversation_id": "uuid"       // 可选，多轮对话
    }
  Response:
    {
      "answer": "根据论文[1]...",
      "citations": [
        {
          "document_id": "uuid",
          "document_title": "xxx",
          "chunk_content": "...",
          "page": 3
        }
      ],
      "source": "archive" | "web",  // 来源标识
      "conversation_id": "uuid"
    }

GET    /api/v1/chat/conversations/:id           获取对话历史
```

### 4.6 评论 API

```
GET    /api/v1/collections/:id/comments         获取精选集评论
POST   /api/v1/collections/:id/comments         发表评论
DELETE /api/v1/comments/:id                     删除评论（仅自己的）
```

### 4.7 购买 API

```
GET    /api/v1/purchases                        获取我的购买记录
POST   /api/v1/purchases/create-checkout        创建支付会话
POST   /api/v1/purchases/webhook                支付回调（Stripe/Paddle）
GET    /api/v1/purchases/access                 检查访问权限
```

---

## 5. RAG 核心流程

### 5.1 文档摄入 (Ingestion)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 文档上传                                                     │
│     ├── PDF → unstructured 解析 → 纯文本                        │
│     ├── URL → httpx 抓取 → html2text → 纯文本                   │
│     └── Markdown → 直接使用                                      │
├─────────────────────────────────────────────────────────────────┤
│  2. 文本分块 (Chunking)                                          │
│     ├── 策略: 语义分块（按段落/章节）                            │
│     ├── Chunk 大小: 512 tokens                                   │
│     ├── Overlap: 50 tokens                                       │
│     └── 保留 Metadata (page, section)                            │
├─────────────────────────────────────────────────────────────────┤
│  3. 向量化 (Embedding)                                           │
│     ├── 模型: text-embedding-3-large (3072 维)                   │
│     ├── 批量处理: 每批 100 chunks                                │
│     └── 存入 Qdrant，带 namespace 标签                           │
├─────────────────────────────────────────────────────────────────┤
│  4. 元数据更新                                                   │
│     ├── Document.chunk_count                                     │
│     ├── Document.token_count                                     │
│     └── Collection.source_count++                                │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 检索 (Retrieval)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Query Embedding                                              │
│     └── 用户问题 → text-embedding-3-large → 向量                 │
├─────────────────────────────────────────────────────────────────┤
│  2. 向量检索 (Qdrant)                                            │
│     ├── 过滤条件: namespace = collection.vector_namespace        │
│     ├── Top-K: 10                                                │
│     └── 返回: chunks + scores                                    │
├─────────────────────────────────────────────────────────────────┤
│  3. 重排序 (Reranker) [Phase 2]                                  │
│     ├── 模型: bge-reranker-v2 或 Cohere Rerank                   │
│     └── 保留 Top-5                                               │
├─────────────────────────────────────────────────────────────────┤
│  4. 相关性判断                                                   │
│     ├── 最高分 > 阈值 → 使用档案库                               │
│     └── 最高分 < 阈值 → 降级联网检索                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 生成 (Generation)

```
┌─────────────────────────────────────────────────────────────────┐
│  场景 A: 档案库命中                                              │
├─────────────────────────────────────────────────────────────────┤
│  System Prompt:                                                  │
│  你是 Index.ai 的 AI 助手。请基于以下档案内容回答用户问题。       │
│  回答时必须标注来源，格式: [来源: 文档名 P.页码]                  │
│  如果档案内容无法回答，请明确说明。                              │
│                                                                  │
│  Context:                                                        │
│  [Document 1: xxx]                                               │
│  内容: ...                                                       │
│  [Document 2: yyy]                                               │
│  内容: ...                                                       │
│                                                                  │
│  User: {question}                                                │
├─────────────────────────────────────────────────────────────────┤
│  场景 B: 降级联网                                                │
├─────────────────────────────────────────────────────────────────┤
│  1. 调用 Tavily/SerpAPI 搜索                                     │
│  2. System Prompt 增加提示:                                      │
│     "档案库无相关内容，以下为网络查询结果。"                      │
│  3. 回答标注: [来源: Web]                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 目录结构

```
server/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py              # 依赖注入（DB session, 当前用户等）
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py        # 路由聚合
│   │       ├── auth.py
│   │       ├── channels.py
│   │       ├── collections.py
│   │       ├── documents.py
│   │       ├── chat.py
│   │       ├── comments.py
│   │       └── purchases.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # 配置（环境变量）
│   │   ├── security.py          # JWT, 密码哈希
│   │   └── exceptions.py        # 自定义异常
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py           # 数据库会话
│   │   └── base.py              # Base model
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── channel.py
│   │   ├── collection.py
│   │   ├── document.py
│   │   ├── purchase.py
│   │   └── comment.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── channel.py
│   │   ├── collection.py
│   │   ├── document.py
│   │   ├── chat.py
│   │   └── purchase.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── channel.py
│   │   ├── collection.py
│   │   ├── document.py
│   │   ├── ingestion/
│   │   │   ├── __init__.py
│   │   │   ├── parser.py        # PDF/HTML 解析
│   │   │   ├── chunker.py       # 文本分块
│   │   │   └── pipeline.py      # 摄入流水线
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── embedder.py      # Embedding 封装
│   │   │   ├── retriever.py     # 检索逻辑
│   │   │   ├── generator.py     # LLM 生成
│   │   │   └── citation.py      # 来源追踪
│   │   ├── chat.py
│   │   └── purchase.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py              # 通用 CRUD
│   │   ├── user.py
│   │   ├── channel.py
│   │   ├── collection.py
│   │   └── document.py
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── ingestion.py         # 文档摄入任务
│   │   ├── embedding.py         # 向量化任务
│   │   └── newsletter.py        # 周报生成任务
│   └── main.py                  # FastAPI 入口
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_collections.py
│   └── test_chat.py
├── scripts/
│   ├── run_dev.sh               # 开发启动脚本
│   ├── run_prod.sh              # 生产启动脚本
│   ├── migrate.sh               # 数据库迁移
│   └── seed.sh                  # 种子数据
├── alembic/                     # 数据库迁移
│   ├── versions/
│   └── env.py
├── pyproject.toml
├── alembic.ini
└── .env.example
```

---

## 7. 开发阶段

### Phase 1: 基础框架

| 任务 | 说明 |
|------|------|
| 项目初始化 | uv + FastAPI + 目录结构 |
| 数据库配置 | PostgreSQL + SQLAlchemy + Alembic |
| 基础模型 | Channel, Collection, Document |
| CRUD API | 频道、精选集、档案的基础接口 |
| Qdrant 集成 | 向量数据库连接 |

### Phase 2: RAG 核心

| 任务 | 说明 |
|------|------|
| 文档解析 | PDF/HTML/Markdown 解析器 |
| 分块策略 | 语义分块实现 |
| Embedding | OpenAI API 集成 |
| 向量检索 | Qdrant 检索逻辑 |
| LLM 生成 | Claude API 集成 + Citation |
| 降级联网 | Tavily/SerpAPI 集成 |

### Phase 3: 用户系统

| 任务 | 说明 |
|------|------|
| 用户认证 | 注册、登录、JWT |
| 权限控制 | 公开/私有精选集、购买检查 |
| UGC 支持 | 用户创建精选集、上传文档 |

### Phase 4: 购买系统

| 任务 | 说明 |
|------|------|
| 支付集成 | Stripe/Paddle 集成 |
| 购买逻辑 | 全平台/单频道通行证 |
| 权限检查 | 访问控制中间件 |

### Phase 5: 完善

| 任务 | 说明 |
|------|------|
| 评论系统 | BBS 功能 |
| 后台任务 | Celery/ARQ 配置 |
| 周报生成 | 自动化内容编排 |
| 缓存优化 | Redis 缓存热点数据 |

---

## 8. 配置管理

### 8.1 环境变量

```bash
# .env.example

# App
APP_ENV=development
APP_DEBUG=true
APP_SECRET_KEY=your-secret-key

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/indexai

# Redis
REDIS_URL=redis://localhost:6379/0

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# OpenAI
OPENAI_API_KEY=sk-xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Tavily (联网检索)
TAVILY_API_KEY=tvly-xxx

# Payment (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

---

## 9. 部署方案

### 9.1 Docker Compose (开发)

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
      - qdrant

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: indexai
      POSTGRES_PASSWORD: indexai
      POSTGRES_DB: indexai
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  qdrant_data:
```

### 9.2 生产部署

| 服务 | 推荐方案 |
|------|----------|
| API | Railway / Render / Fly.io |
| PostgreSQL | Neon / Supabase / RDS |
| Redis | Upstash / ElastiCache |
| Qdrant | Qdrant Cloud |

---

## 10. 待确认问题

1. **支付服务商**：Stripe 还是 Paddle？（Paddle 对海外税务友好）
2. **后台任务**：Celery 还是 ARQ？（ARQ 更轻量）
3. **联网检索**：Tavily 还是 SerpAPI？
4. **文件存储**：本地存储还是 S3/R2？
5. **日志服务**：本地文件还是集成 Sentry/Logfire？
