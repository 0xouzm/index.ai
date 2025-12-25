/**
 * Document processing service
 * Handles content extraction, chunking, embedding, and vector storage
 */

import type { Env } from "../types/env";
import { chunkMarkdown, estimateTokens, type Chunk } from "./chunking";
import { getEmbeddings, EMBEDDING_DIMENSIONS } from "./embedding";
import { analyzeSource } from "./source-analyzer";

export interface ProcessDocumentResult {
  success: boolean;
  chunkCount: number;
  tokenCount: number;
  summary?: string;
  topics?: string[];
  error?: string;
}

export interface DocumentInfo {
  id: string;
  collectionId: string;
  namespace: string;
  title: string;
  sourceType: "markdown" | "url" | "pdf";
  content?: string;
  sourceUrl?: string;
}

/**
 * Process a document: chunk, embed, and store in Vectorize
 */
export async function processDocument(
  doc: DocumentInfo,
  env: Env
): Promise<ProcessDocumentResult> {
  try {
    // Step 1: Get content
    let content = doc.content;

    if (doc.sourceType === "url" && doc.sourceUrl) {
      content = await fetchUrlContent(doc.sourceUrl);
    }

    if (!content || content.trim().length === 0) {
      return { success: false, chunkCount: 0, tokenCount: 0, error: "No content to process" };
    }

    // Step 2: Analyze source with AI (generates summary, topics, and cleaned content)
    const analysis = await analyzeSource(content, env);
    const processedContent = analysis.processedContent || content;

    // Step 3: Chunk the processed content (small chunks for precise search)
    const chunks = chunkMarkdown(processedContent, {
      maxChunkSize: 1500,
      chunkOverlap: 200,
      minChunkSize: 100,
    });

    if (chunks.length === 0) {
      return { success: false, chunkCount: 0, tokenCount: 0, error: "No chunks generated" };
    }

    // Step 4: Generate embeddings
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await getEmbeddings(chunkTexts, env);

    // Step 5: Store in Vectorize (include position info for context expansion)
    const vectors = chunks.map((chunk, idx) => ({
      id: `${doc.id}_chunk_${idx}`,
      values: embeddings[idx].embedding,
      metadata: {
        document_id: doc.id,
        collection_id: doc.collectionId,
        namespace: doc.namespace,
        content: chunk.content,
        chunk_index: chunk.index,
        section: chunk.metadata.section || "",
        title: doc.title,
        start_char: chunk.metadata.startChar,
        end_char: chunk.metadata.endChar,
      },
    }));

    // Vectorize upsert (batch if needed)
    // Skip in local development (VECTORIZE binding throws in local mode)
    if (env.VECTORIZE && env.ENVIRONMENT !== "development") {
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await env.VECTORIZE.upsert(batch);
      }
    } else {
      console.warn("Vectorize not available or in dev mode, skipping vector storage");
    }

    // Step 6: Save content, processed content, summary and topics to database
    const topicsJson = JSON.stringify(analysis.topics);
    await env.DB.prepare(
      `UPDATE documents
       SET content = ?, processed_content = ?, summary = ?, topics = ?
       WHERE id = ?`
    )
      .bind(content, processedContent, analysis.summary, topicsJson, doc.id)
      .run();

    // Calculate total tokens
    const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokens(chunk.content), 0);

    return {
      success: true,
      chunkCount: chunks.length,
      tokenCount: totalTokens,
      summary: analysis.summary,
      topics: analysis.topics,
    };
  } catch (error) {
    console.error("Error processing document:", error);
    return {
      success: false,
      chunkCount: 0,
      tokenCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete document vectors from Vectorize
 */
export async function deleteDocumentVectors(
  documentId: string,
  chunkCount: number,
  env: Env
): Promise<boolean> {
  try {
    if (!env.VECTORIZE) {
      console.warn("Vectorize not configured, skipping vector deletion");
      return true;
    }

    const ids = Array.from({ length: chunkCount }, (_, i) => `${documentId}_chunk_${i}`);

    // Delete in batches
    const batchSize = 100;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      await env.VECTORIZE.deleteByIds(batch);
    }

    return true;
  } catch (error) {
    console.error("Error deleting document vectors:", error);
    return false;
  }
}

/**
 * Fetch and extract content from URL
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IndexAI/1.0; +https://index.ai)",
        "Accept": "text/html,application/xhtml+xml,text/plain,text/markdown",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    // If it's HTML, extract main content
    if (contentType.includes("text/html")) {
      return extractTextFromHtml(text);
    }

    // For plain text or markdown, return as-is
    return text;
  } catch (error) {
    console.error("Error fetching URL:", error);
    throw error;
  }
}

/**
 * Simple HTML to text extraction
 * For production, consider using a proper HTML parser
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");

  // Convert headers to markdown-style
  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  // Convert paragraphs and line breaks
  text = text
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "");

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return text;
}

export { EMBEDDING_DIMENSIONS };
