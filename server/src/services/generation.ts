import type { Env } from "../types/env";
import type { RetrievedChunk } from "./retrieval";
import { buildContext, buildSystemPrompt } from "./prompt-builder";
import { normalizeCitations } from "../utils/citation-normalizer";

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

// Kimi API (Moonshot AI) - OpenAI compatible
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const KIMI_THINKING_MODEL = "kimi-thinking-preview";

// Extract citations from answer text
function extractCitations(
  answer: string,
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>
): Citation[] {
  // Normalize citations first to ensure consistent [N] format
  const normalized = normalizeCitations(answer);

  const citations: Citation[] = [];
  // Simple regex - only match normalized [N] format
  const citationRegex = /\[(\d+)\]/g;
  const seenDocs = new Set<number>();

  for (const match of normalized.matchAll(citationRegex)) {
    const docIdx = parseInt(match[1], 10) - 1;
    if (docIdx >= 0 && docIdx < chunks.length && !seenDocs.has(docIdx)) {
      seenDocs.add(docIdx);
      const chunk = chunks[docIdx];
      const contentPreview = chunk.content.length > 500
        ? chunk.content.substring(0, 500) + "..."
        : chunk.content;
      citations.push({
        documentId: chunk.documentId,
        documentTitle: documentTitles.get(chunk.documentId) || "Unknown",
        chunkContent: contentPreview,
        page: chunk.metadata.page,
      });
    }
  }

  return citations;
}

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>,
  env: Env,
  options?: { source: "archive" | "web" }
): Promise<GenerationResult> {
  const apiKey = env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY not configured");
  }

  const source = options?.source || "archive";
  const context = buildContext(chunks, documentTitles);
  const systemPrompt = buildSystemPrompt(source, context);

  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIMI_THINKING_MODEL,
      max_tokens: 8192,
      temperature: 0.8,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error: ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: { role: string; content: string; reasoning_content?: string };
    }>;
  };

  const message = data.choices[0]?.message;
  const answer = message?.content || "";
  const citations = extractCitations(answer, chunks, documentTitles);

  return { answer, citations };
}

// Generate answer without context (for simple questions)
export async function generateSimpleAnswer(question: string, env: Env): Promise<string> {
  const apiKey = env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY not configured");
  }

  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIMI_THINKING_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error: ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { role: string; content: string } }>;
  };

  return data.choices[0]?.message?.content || "";
}
