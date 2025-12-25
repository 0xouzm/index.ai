/**
 * Document processing service
 * Handles content extraction, chunking, embedding, and vector storage
 */

import type { Env } from "../types/env";
import { chunkMarkdown, estimateTokens, type Chunk } from "./chunking";
import { getEmbeddings, EMBEDDING_DIMENSIONS } from "./embedding";
import { analyzeSource } from "./source-analyzer";
import { extractFromUrl, extractFromR2 } from "./content-extractor";

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
  r2Key?: string;
}

/**
 * Process a document: chunk, embed, and store in Vectorize
 */
export async function processDocument(
  doc: DocumentInfo,
  env: Env
): Promise<ProcessDocumentResult> {
  try {
    // Step 1: Get content based on source type
    let content = doc.content;
    let extractedTitle = doc.title;

    if (doc.sourceType === "url" && doc.sourceUrl) {
      // Use Readability algorithm for URL content extraction
      const extracted = await extractFromUrl(doc.sourceUrl);
      content = extracted.content;
      // Use extracted title if original is empty
      if (!extractedTitle || extractedTitle.trim() === "") {
        extractedTitle = extracted.title;
      }
    } else if (doc.sourceType === "pdf" && doc.r2Key && env.DOCUMENTS) {
      // Extract content from PDF stored in R2
      const pdfContent = await extractFromR2(env.DOCUMENTS, doc.r2Key);
      content = pdfContent.content;
      if (!extractedTitle || extractedTitle.trim() === "") {
        extractedTitle = pdfContent.title || doc.title;
      }
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
        title: extractedTitle,
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

export { EMBEDDING_DIMENSIONS };
