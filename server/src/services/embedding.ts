import type { Env } from "../types/env";

// Cloudflare AI embedding model
// bge-base-en-v1.5: 768 dimensions
// bge-large-en-v1.5: 1024 dimensions
const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5";
const EMBEDDING_DIMENSIONS = 768;

// Cloudflare AI embedding response type
interface EmbeddingResponse {
  shape: number[];
  data: number[][];
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export async function getEmbedding(
  text: string,
  env: Env
): Promise<EmbeddingResult> {
  // Use Cloudflare AI for embeddings
  const result = (await env.AI.run(EMBEDDING_MODEL, {
    text: [text],
  })) as EmbeddingResponse;

  // Cloudflare AI returns { shape: [n, dimensions], data: [[...embedding]] }
  const embedding = result.data[0];

  return {
    embedding: embedding,
    tokenCount: Math.ceil(text.length / 4), // Approximate token count
  };
}

export async function getEmbeddings(
  texts: string[],
  env: Env
): Promise<EmbeddingResult[]> {
  if (texts.length === 0) {
    return [];
  }

  // Cloudflare AI can handle batch inputs
  const batchSize = 100;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const result = (await env.AI.run(EMBEDDING_MODEL, {
      text: batch,
    })) as EmbeddingResponse;

    // Each embedding in the batch
    for (let j = 0; j < batch.length; j++) {
      results.push({
        embedding: result.data[j],
        tokenCount: Math.ceil(batch[j].length / 4),
      });
    }
  }

  return results;
}

export { EMBEDDING_DIMENSIONS };
