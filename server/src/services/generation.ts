import type { Env } from "../types/env";
import type { RetrievedChunk } from "./retrieval";

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  page?: number;
}

export interface GenerationResult {
  answer: string;
  citations: Citation[];
}

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>,
  env: Env,
  options?: {
    source: "archive" | "web";
  }
): Promise<GenerationResult> {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const source = options?.source || "archive";

  // Build context from chunks
  const contextParts = chunks.map((chunk, idx) => {
    const docTitle = documentTitles.get(chunk.documentId) || "Unknown Document";
    const pageInfo = chunk.metadata.page ? ` (Page ${chunk.metadata.page})` : "";
    return `[Document ${idx + 1}: ${docTitle}${pageInfo}]\n${chunk.content}`;
  });

  const context = contextParts.join("\n\n---\n\n");

  // Build system prompt
  let systemPrompt: string;

  if (source === "archive") {
    systemPrompt = `You are an AI assistant for Index.ai, a knowledge portal.
Your task is to answer questions based ONLY on the provided document excerpts.

Rules:
1. Only use information from the provided documents
2. Always cite your sources using the format [Document X]
3. If the documents don't contain relevant information, say so clearly
4. Be concise but thorough
5. Use the same language as the user's question

Documents:
${context}`;
  } else {
    systemPrompt = `You are an AI assistant for Index.ai.
The user's question could not be answered from the archive, so web search results are provided.

IMPORTANT: Start your response by noting that this information comes from web search, not the curated archive.

Web Search Results:
${context}

Rules:
1. Clearly indicate this is from web search
2. Be helpful but note the information may be less reliable than archive content
3. Cite sources when possible`;
  }

  // Call Claude API
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const answer = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  // Extract citations from the answer
  const citations: Citation[] = [];
  const citationRegex = /\[Document (\d+)\]/g;
  const matches = answer.matchAll(citationRegex);

  const seenDocs = new Set<number>();
  for (const match of matches) {
    const docIdx = parseInt(match[1], 10) - 1;
    if (docIdx >= 0 && docIdx < chunks.length && !seenDocs.has(docIdx)) {
      seenDocs.add(docIdx);
      const chunk = chunks[docIdx];
      citations.push({
        documentId: chunk.documentId,
        documentTitle: documentTitles.get(chunk.documentId) || "Unknown",
        chunkContent: chunk.content.substring(0, 200) + "...",
        page: chunk.metadata.page,
      });
    }
  }

  return {
    answer,
    citations,
  };
}

// Generate answer without context (for simple questions)
export async function generateSimpleAnswer(
  question: string,
  env: Env
): Promise<string> {
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  return data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}
