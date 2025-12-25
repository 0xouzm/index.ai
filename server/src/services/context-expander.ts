/**
 * Context expansion service
 * Expands chunk content to include surrounding context from original document
 */

import type { Env } from "../types/env";
import type { RetrievedChunk } from "./retrieval";

export interface ExpandedChunk extends RetrievedChunk {
  expandedContent: string;
  hasExpansion: boolean;
}

export interface ExpansionOptions {
  expandChars?: number;
  ensureParagraph?: boolean;
}

const DEFAULT_EXPAND_CHARS = 500;

/**
 * Expand a single chunk with surrounding context
 */
function expandChunkContent(
  chunk: RetrievedChunk,
  documentContent: string,
  options?: ExpansionOptions
): ExpandedChunk {
  const expandChars = options?.expandChars ?? DEFAULT_EXPAND_CHARS;
  const ensureParagraph = options?.ensureParagraph ?? true;

  const { startChar, endChar } = chunk.metadata;

  // If no position info or no content, return original
  if (startChar === undefined || endChar === undefined || !documentContent) {
    return {
      ...chunk,
      expandedContent: chunk.content,
      hasExpansion: false,
    };
  }

  let startPos = Math.max(0, startChar - expandChars);
  let endPos = Math.min(documentContent.length, endChar + expandChars);

  // Expand to paragraph boundaries
  if (ensureParagraph) {
    // Find paragraph start (look for double newline before startPos)
    const beforeText = documentContent.slice(0, startPos);
    const paragraphStart = beforeText.lastIndexOf("\n\n");
    if (paragraphStart !== -1 && startPos - paragraphStart < expandChars * 2) {
      startPos = paragraphStart + 2;
    }

    // Find paragraph end (look for double newline after endPos)
    const afterText = documentContent.slice(endPos);
    const paragraphEnd = afterText.indexOf("\n\n");
    if (paragraphEnd !== -1 && paragraphEnd < expandChars * 2) {
      endPos = endPos + paragraphEnd;
    }
  }

  const expandedContent = documentContent.slice(startPos, endPos).trim();

  return {
    ...chunk,
    expandedContent,
    hasExpansion: expandedContent.length > chunk.content.length,
  };
}

/**
 * Expand all chunks, grouped by document for efficiency
 */
export async function expandAllChunks(
  chunks: RetrievedChunk[],
  env: Env,
  options?: ExpansionOptions
): Promise<ExpandedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  // Group chunks by document
  const chunksByDoc = new Map<string, RetrievedChunk[]>();
  for (const chunk of chunks) {
    const docChunks = chunksByDoc.get(chunk.documentId) || [];
    docChunks.push(chunk);
    chunksByDoc.set(chunk.documentId, docChunks);
  }

  // Batch fetch all document contents
  const docIds = Array.from(chunksByDoc.keys()).filter((id) => id);
  if (docIds.length === 0) {
    return chunks.map((chunk) => ({
      ...chunk,
      expandedContent: chunk.content,
      hasExpansion: false,
    }));
  }

  const placeholders = docIds.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT id, content FROM documents WHERE id IN (${placeholders})`
  )
    .bind(...docIds)
    .all<{ id: string; content: string | null }>();

  // Build content map
  const contentMap = new Map<string, string>();
  for (const doc of results || []) {
    if (doc.content) {
      contentMap.set(doc.id, doc.content);
    }
  }

  // Expand all chunks
  return chunks.map((chunk) => {
    const docContent = contentMap.get(chunk.documentId) || "";
    return expandChunkContent(chunk, docContent, options);
  });
}
