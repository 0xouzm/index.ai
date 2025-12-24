import type { Env } from "../types/env";

const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 3072;

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export async function getEmbedding(
  text: string,
  env: Env
): Promise<EmbeddingResult> {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
    usage: { total_tokens: number };
  };

  return {
    embedding: data.data[0].embedding,
    tokenCount: data.usage.total_tokens,
  };
}

export async function getEmbeddings(
  texts: string[],
  env: Env
): Promise<EmbeddingResult[]> {
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Batch in groups of 100
  const batchSize = 100;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
      usage: { total_tokens: number };
    };

    // Sort by index to maintain order
    const sortedData = data.data.sort((a, b) => a.index - b.index);
    const tokensPerItem = Math.floor(data.usage.total_tokens / batch.length);

    for (const item of sortedData) {
      results.push({
        embedding: item.embedding,
        tokenCount: tokensPerItem,
      });
    }
  }

  return results;
}
