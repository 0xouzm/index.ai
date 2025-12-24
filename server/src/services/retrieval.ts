import type { Env } from "../types/env";
import { getEmbedding } from "./embedding";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  score: number;
  metadata: {
    page?: number;
    section?: string;
  };
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  hasRelevantResults: boolean;
}

const RELEVANCE_THRESHOLD = 0.7;
const TOP_K = 10;

export async function retrieveChunks(
  query: string,
  namespace: string,
  env: Env,
  options?: {
    topK?: number;
    threshold?: number;
    documentIds?: string[];
  }
): Promise<RetrievalResult> {
  const topK = options?.topK || TOP_K;
  const threshold = options?.threshold || RELEVANCE_THRESHOLD;

  // Get query embedding
  const { embedding } = await getEmbedding(query, env);

  // Check if Vectorize is available
  if (!env.VECTORIZE) {
    console.warn("Vectorize not configured, returning empty results");
    return { chunks: [], hasRelevantResults: false };
  }

  // Build filter
  const filter: Record<string, string | string[]> = {
    namespace: namespace,
  };

  if (options?.documentIds && options.documentIds.length > 0) {
    filter.document_id = options.documentIds;
  }

  // Query Vectorize
  const results = await env.VECTORIZE.query(embedding, {
    topK,
    filter,
    returnMetadata: "all",
  });

  // Transform results
  const chunks: RetrievedChunk[] = results.matches.map((match) => ({
    id: match.id,
    documentId: (match.metadata?.document_id as string) || "",
    content: (match.metadata?.content as string) || "",
    score: match.score,
    metadata: {
      page: match.metadata?.page as number | undefined,
      section: match.metadata?.section as string | undefined,
    },
  }));

  // Check if we have relevant results
  const hasRelevantResults =
    chunks.length > 0 && chunks[0].score >= threshold;

  return {
    chunks: chunks.filter((c) => c.score >= threshold * 0.5), // Keep somewhat relevant results
    hasRelevantResults,
  };
}

// Web search fallback using Tavily (or similar)
export async function webSearch(
  query: string,
  env: Env
): Promise<{ results: Array<{ title: string; content: string; url: string }> }> {
  // For now, return empty results
  // TODO: Implement Tavily or SerpAPI integration
  console.warn("Web search not implemented yet");
  return { results: [] };
}
