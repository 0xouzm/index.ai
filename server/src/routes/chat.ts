import { Hono } from "hono";
import type { AppEnv } from "../types/env";
import { retrieveChunks, webSearch } from "../services/retrieval";
import { generateAnswer } from "../services/generation";
import { cleanAnswerFormat } from "../services/prompt-builder";

export const chatRouter = new Hono<AppEnv>();

interface QueryRequest {
  collectionId: string;
  question: string;
  documentIds?: string[];
  conversationId?: string;
}

interface Citation {
  sourceIndex: number;
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  page?: number;
}

interface QueryResponse {
  answer: string;
  citations: Citation[];
  source: "archive" | "web";
  conversationId: string;
}

// Chat query endpoint
chatRouter.post("/query", async (c) => {
  try {
    const body = await c.req.json<QueryRequest>();
    const { collectionId, question, documentIds, conversationId } = body;

    if (!collectionId || !question) {
      return c.json({ error: "collectionId and question are required" }, 400);
    }

    const collection = await c.env.DB.prepare(
      "SELECT * FROM collections WHERE id = ?"
    )
      .bind(collectionId)
      .first<{ id: string; title: string; vector_namespace: string }>();

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    const { results: documents } = await c.env.DB.prepare(
      "SELECT id, title FROM documents WHERE collection_id = ?"
    )
      .bind(collectionId)
      .all<{ id: string; title: string }>();

    const documentTitles = new Map<string, string>();
    for (const doc of documents || []) {
      documentTitles.set(doc.id, doc.title);
    }

    if (!c.env.KIMI_API_KEY) {
      return c.json({
        answer: `[Demo Mode] This is a demonstration response for: "${question}"\n\nTo enable real AI responses, configure KIMI_API_KEY in your Cloudflare Worker secrets.`,
        citations: [],
        source: "archive",
        conversationId: conversationId || crypto.randomUUID(),
      } as QueryResponse);
    }

    const retrievalResult = await retrieveChunks(
      question,
      collection.vector_namespace,
      c.env,
      { documentIds }
    );

    let source: "archive" | "web" = "archive";
    let chunks = retrievalResult.chunks;

    if (!retrievalResult.hasRelevantResults) {
      source = "web";
      const webResults = await webSearch(question, c.env);
      chunks = webResults.results.map((result, idx) => ({
        id: `web-${idx}`,
        documentId: `web-${idx}`,
        content: `${result.title}\n\n${result.content}\n\nSource: ${result.url}`,
        score: 1.0,
        metadata: {},
      }));
      for (const result of webResults.results) {
        documentTitles.set(`web-${webResults.results.indexOf(result)}`, result.title);
      }
    }

    if (chunks.length === 0) {
      return c.json({
        answer: "I couldn't find relevant information. Please try rephrasing your question.",
        citations: [],
        source,
        conversationId: conversationId || crypto.randomUUID(),
      } as QueryResponse);
    }

    const generationResult = await generateAnswer(
      question,
      chunks,
      documentTitles,
      c.env,
      { source }
    );

    return c.json({
      answer: cleanAnswerFormat(generationResult.answer),
      citations: generationResult.citations,
      source,
      conversationId: conversationId || crypto.randomUUID(),
    } as QueryResponse);
  } catch (error) {
    console.error("Error processing chat query:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Failed to process query" },
      500
    );
  }
});

// Get conversation history
chatRouter.get("/conversations/:id", async (c) => {
  const conversationId = c.req.param("id");
  return c.json({ conversationId, messages: [] });
});
