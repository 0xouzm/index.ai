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
  thinkingSteps?: string[];
}

export interface ThinkingEvent {
  type: "thinking" | "content" | "done";
  content?: string;
  step?: string;
}

// Kimi API (Moonshot AI) - OpenAI compatible
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const KIMI_THINKING_MODEL = "kimi-thinking-preview";

export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>,
  env: Env,
  options?: {
    source: "archive" | "web";
  }
): Promise<GenerationResult> {
  const apiKey = env.KIMI_API_KEY;

  if (!apiKey) {
    throw new Error("KIMI_API_KEY not configured");
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

CITATION FORMAT - EXTREMELY IMPORTANT:
- You MUST cite sources using: [1], [2], [3], etc.
- Format is simple: just the number in square brackets
- Example: "DeepSeek uses MoE [1]. It has 256 experts [2]."
- NEVER write "[Document]" without a number - this is WRONG
- NEVER write "[Document 1]" - use [1] instead
- Every claim MUST have a citation number

Rules:
1. Only use information from the provided documents
2. If documents don't contain relevant info, say so clearly
3. Be concise but thorough
4. Use the same language as the user's question

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

  // Call Kimi API (OpenAI compatible format)
  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error: ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  };

  const answer = data.choices[0]?.message?.content || "";

  // Extract citations - match various formats from AI:
  // [1], [2], [Document 1], [Doc 1], etc.
  const citations: Citation[] = [];
  const citationRegex = /\[\s*(\d+)\s*\]|\[?\s*(?:Doc(?:ument)?\s*)?(\d+)(?::\s*[^\]]+)?\s*\]/gi;
  const matches = answer.matchAll(citationRegex);

  const seenDocs = new Set<number>();
  for (const match of matches) {
    const docNum = match[1] || match[2];
    const docIdx = parseInt(docNum, 10) - 1;
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

// Stream answer generation
export async function* streamAnswer(
  question: string,
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>,
  env: Env,
  options?: { source: "archive" | "web" }
): AsyncGenerator<string, Citation[], undefined> {
  const apiKey = env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY not configured");
  }

  const source = options?.source || "archive";

  const contextParts = chunks.map((chunk, idx) => {
    const docTitle = documentTitles.get(chunk.documentId) || "Unknown Document";
    const pageInfo = chunk.metadata.page ? ` (Page ${chunk.metadata.page})` : "";
    return `[Document ${idx + 1}: ${docTitle}${pageInfo}]\n${chunk.content}`;
  });

  const context = contextParts.join("\n\n---\n\n");

  let systemPrompt: string;
  if (source === "archive") {
    systemPrompt = `You are an AI assistant for Index.ai, a knowledge portal.
Your task is to answer questions based ONLY on the provided document excerpts.

CITATION FORMAT - EXTREMELY IMPORTANT:
- You MUST cite sources using: [1], [2], [3], etc.
- Format is simple: just the number in square brackets
- Example: "DeepSeek uses MoE [1]. It has 256 experts [2]."
- NEVER write "[Document]" without a number - this is WRONG
- NEVER write "[Document 1]" - use [1] instead
- Every claim MUST have a citation number

Rules:
1. Only use information from the provided documents
2. If documents don't contain relevant info, say so clearly
3. Be concise but thorough
4. Use the same language as the user's question

Documents:
${context}`;
  } else {
    systemPrompt = `You are an AI assistant for Index.ai.
The user's question could not be answered from the archive, so web search results are provided.

Web Search Results:
${context}`;
  }

  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      max_tokens: 2048,
      temperature: 0.7,
      stream: true,
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

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let fullAnswer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta: { content?: string } }>;
          };
          const content = parsed.choices[0]?.delta?.content || "";
          if (content) {
            fullAnswer += content;
            yield content;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  // Extract citations - match various formats from AI:
  // [1], [2], [Document 1], [Doc 1], etc.
  const citations: Citation[] = [];
  const citationRegex = /\[\s*(\d+)\s*\]|\[?\s*(?:Doc(?:ument)?\s*)?(\d+)(?::\s*[^\]]+)?\s*\]/gi;
  const matches = fullAnswer.matchAll(citationRegex);
  const seenDocs = new Set<number>();

  for (const match of matches) {
    const docNum = match[1] || match[2];
    const docIdx = parseInt(docNum, 10) - 1;
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

  return citations;
}

// Generate answer without context (for simple questions)
export async function generateSimpleAnswer(
  question: string,
  env: Env
): Promise<string> {
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
      model: KIMI_MODEL,
      max_tokens: 1024,
      temperature: 0.7,
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
    throw new Error(`Kimi API error: ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  };

  return data.choices[0]?.message?.content || "";
}
