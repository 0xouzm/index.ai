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
    startChar?: number;
    endChar?: number;
  };
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  hasRelevantResults: boolean;
}

const RELEVANCE_THRESHOLD = 0.3; // Lowered for testing
const TOP_K = 15; // Increased from 10 for broader context coverage

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

  // Query Vectorize with namespace filter only
  // Note: document_id filtering requires a metadata index which hasn't been created
  // We filter by documentIds in the application layer after retrieval
  const results = await env.VECTORIZE.query(embedding, {
    topK: options?.documentIds ? topK * 3 : topK, // Fetch more if we need to filter
    returnMetadata: "all",
    filter: { namespace: namespace },
  });

  console.log(`Vectorize query for namespace: ${namespace}, returned ${results.matches.length} results`);

  // Transform results (include position info for context expansion)
  let chunks: RetrievedChunk[] = results.matches.map((match) => ({
    id: match.id,
    documentId: (match.metadata?.document_id as string) || "",
    content: (match.metadata?.content as string) || "",
    score: match.score,
    metadata: {
      page: match.metadata?.page as number | undefined,
      section: match.metadata?.section as string | undefined,
      startChar: match.metadata?.start_char as number | undefined,
      endChar: match.metadata?.end_char as number | undefined,
    },
  }));

  // Application-layer filtering by documentIds (since Vectorize needs metadata index)
  if (options?.documentIds && options.documentIds.length > 0) {
    const docIdSet = new Set(options.documentIds);
    chunks = chunks.filter((chunk) => docIdSet.has(chunk.documentId));
    console.log(`Filtered to ${chunks.length} chunks from selected documents`);
  }

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
