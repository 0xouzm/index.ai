export interface Env {
  // D1 Database
  DB: D1Database;

  // Vectorize Index
  VECTORIZE?: VectorizeIndex;

  // R2 Bucket
  DOCUMENTS?: R2Bucket;

  // KV Namespaces
  CACHE?: KVNamespace;
  SESSIONS?: KVNamespace;

  // Queue
  INGESTION_QUEUE?: Queue;

  // AI Gateway
  AI: Ai;

  // Environment Variables
  ENVIRONMENT: string;

  // Secrets (set via wrangler secret put)
  JWT_SECRET?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  KIMI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
}

// Hono context variables (set by auth middleware)
export interface Variables {
  userId: string;
  userEmail: string;
  username: string;
}

// Combined app type for Hono
export interface AppEnv {
  Bindings: Env;
  Variables: Variables;
}
