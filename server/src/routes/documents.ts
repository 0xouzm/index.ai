import { Hono } from "hono";
import type { AppEnv } from "../types/env";
import { toCamelCase } from "../utils/case-transform";
import { processDocument, deleteDocumentVectors } from "../services/document-processor";
import { analyzeSource } from "../services/source-analyzer";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

export const documentsRouter = new Hono<AppEnv>();

interface CreateDocumentRequest {
  collectionId: string;
  title: string;
  sourceType: "markdown" | "url";
  content?: string;
  sourceUrl?: string;
}

// Create document (with processing)
documentsRouter.post("/", optionalAuthMiddleware(), async (c) => {
  try {
    const body = await c.req.json<CreateDocumentRequest>();
    const { collectionId, title, sourceType, content, sourceUrl } = body;

    // Validate input
    if (!collectionId || !title || !sourceType) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (sourceType === "markdown" && !content) {
      return c.json({ error: "Content is required for markdown type" }, 400);
    }

    if (sourceType === "url" && !sourceUrl) {
      return c.json({ error: "Source URL is required for url type" }, 400);
    }

    // Get collection to verify it exists and get namespace
    const collection = await c.env.DB.prepare(
      "SELECT id, vector_namespace FROM collections WHERE id = ?"
    )
      .bind(collectionId)
      .first<{ id: string; vector_namespace: string }>();

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    // Generate document ID
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Insert document with pending status (content will be updated after processing for URL type)
    await c.env.DB.prepare(
      `INSERT INTO documents (id, collection_id, title, source_type, source_url, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'processing', datetime('now'), datetime('now'))`
    )
      .bind(docId, collectionId, title, sourceType, sourceUrl || null, content || null)
      .run();

    // Process document (chunking, embedding, vector storage)
    const result = await processDocument(
      {
        id: docId,
        collectionId,
        namespace: collection.vector_namespace,
        title,
        sourceType,
        content,
        sourceUrl,
      },
      c.env
    );

    if (result.success) {
      // Update document with chunk count and status
      await c.env.DB.prepare(
        `UPDATE documents
         SET chunk_count = ?, token_count = ?, status = 'completed', updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(result.chunkCount, result.tokenCount, docId)
        .run();

      // Update collection source count
      await c.env.DB.prepare(
        `UPDATE collections
         SET source_count = source_count + 1, updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(collectionId)
        .run();
    } else {
      // Mark as failed
      await c.env.DB.prepare(
        `UPDATE documents SET status = 'failed', updated_at = datetime('now') WHERE id = ?`
      )
        .bind(docId)
        .run();

      return c.json({ error: result.error || "Failed to process document" }, 500);
    }

    // Fetch and return the created document
    const document = await c.env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(docId)
      .first();

    return c.json({ document: toCamelCase(document) }, 201);
  } catch (error) {
    console.error("Error creating document:", error);
    return c.json({ error: "Failed to create document" }, 500);
  }
});

// Get documents by collection
documentsRouter.get("/", async (c) => {
  const collectionId = c.req.query("collectionId");

  if (!collectionId) {
    return c.json({ error: "collectionId is required" }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM documents WHERE collection_id = ? ORDER BY created_at DESC"
    )
      .bind(collectionId)
      .all();

    return c.json({ documents: toCamelCase(results) });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return c.json({ error: "Failed to fetch documents" }, 500);
  }
});

// Get single document
documentsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const document = await c.env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(id)
      .first();

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    return c.json({ document: toCamelCase(document) });
  } catch (error) {
    console.error("Error fetching document:", error);
    return c.json({ error: "Failed to fetch document" }, 500);
  }
});

// Delete document
documentsRouter.delete("/:id", optionalAuthMiddleware(), async (c) => {
  const id = c.req.param("id");

  try {
    // Get document info for cleanup
    const document = await c.env.DB.prepare(
      "SELECT id, collection_id, chunk_count FROM documents WHERE id = ?"
    )
      .bind(id)
      .first<{ id: string; collection_id: string; chunk_count: number }>();

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Delete vectors from Vectorize
    if (document.chunk_count > 0) {
      await deleteDocumentVectors(id, document.chunk_count, c.env);
    }

    // Delete from database
    await c.env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();

    // Update collection source count
    await c.env.DB.prepare(
      `UPDATE collections
       SET source_count = MAX(0, source_count - 1), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(document.collection_id)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return c.json({ error: "Failed to delete document" }, 500);
  }
});

// Reprocess document (for failed documents)
documentsRouter.post("/:id/reprocess", optionalAuthMiddleware(), async (c) => {
  const id = c.req.param("id");

  try {
    const document = await c.env.DB.prepare(
      `SELECT d.*, c.vector_namespace
       FROM documents d
       JOIN collections c ON d.collection_id = c.id
       WHERE d.id = ?`
    )
      .bind(id)
      .first<{
        id: string;
        collection_id: string;
        title: string;
        source_type: string;
        source_url: string | null;
        content: string | null;
        vector_namespace: string;
        chunk_count: number;
      }>();

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Delete existing vectors if any
    if (document.chunk_count > 0) {
      await deleteDocumentVectors(id, document.chunk_count, c.env);
    }

    // Update status to processing
    await c.env.DB.prepare(
      `UPDATE documents SET status = 'processing', updated_at = datetime('now') WHERE id = ?`
    )
      .bind(id)
      .run();

    // Reprocess - for URL type, we can refetch; for markdown, use stored content
    const result = await processDocument(
      {
        id: document.id,
        collectionId: document.collection_id,
        namespace: document.vector_namespace,
        title: document.title,
        sourceType: document.source_type as "url" | "markdown",
        sourceUrl: document.source_url || undefined,
        content: document.content || undefined,
      },
      c.env
    );

    if (result.success) {
      await c.env.DB.prepare(
        `UPDATE documents
         SET chunk_count = ?, token_count = ?, status = 'completed', updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(result.chunkCount, result.tokenCount, id)
        .run();
    } else {
      await c.env.DB.prepare(
        `UPDATE documents SET status = 'failed', updated_at = datetime('now') WHERE id = ?`
      )
        .bind(id)
        .run();

      return c.json({ error: result.error || "Failed to reprocess document" }, 500);
    }

    const updated = await c.env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(id)
      .first();

    return c.json({ document: toCamelCase(updated) });
  } catch (error) {
    console.error("Error reprocessing document:", error);
    return c.json({ error: "Failed to reprocess document" }, 500);
  }
});

// Analyze document (generate summary and topics with AI)
documentsRouter.post("/:id/analyze", optionalAuthMiddleware(), async (c) => {
  const id = c.req.param("id");

  try {
    const document = await c.env.DB.prepare(
      "SELECT id, content, processed_content, summary, topics FROM documents WHERE id = ?"
    )
      .bind(id)
      .first<{
        id: string;
        content: string | null;
        processed_content: string | null;
        summary: string | null;
        topics: string | null;
      }>();

    if (!document) {
      return c.json({ error: "Document not found" }, 404);
    }

    // Use processed_content if available, otherwise use raw content
    const contentToAnalyze = document.processed_content || document.content;

    if (!contentToAnalyze) {
      return c.json({ error: "No content available for analysis" }, 400);
    }

    // Call AI to analyze
    const analysis = await analyzeSource(contentToAnalyze, c.env);

    // Update document with analysis results
    await c.env.DB.prepare(
      `UPDATE documents
       SET summary = ?, topics = ?, processed_content = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(
        analysis.summary,
        JSON.stringify(analysis.topics),
        analysis.processedContent,
        id
      )
      .run();

    // Fetch updated document
    const updated = await c.env.DB.prepare("SELECT * FROM documents WHERE id = ?")
      .bind(id)
      .first();

    return c.json({ document: toCamelCase(updated) });
  } catch (error) {
    console.error("Error analyzing document:", error);
    return c.json({ error: "Failed to analyze document" }, 500);
  }
});
