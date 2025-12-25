import type { RetrievedChunk } from "./retrieval";
import { normalizeCitations, renumberLists, removeInvalidCitationFragments } from "../utils/citation-normalizer";

export function buildContext(
  chunks: RetrievedChunk[],
  documentTitles: Map<string, string>
): string {
  const contextParts = chunks.map((chunk, idx) => {
    const docTitle = documentTitles.get(chunk.documentId) || "Unknown Document";
    const pageInfo = chunk.metadata.page ? ` (Page ${chunk.metadata.page})` : "";
    return `[Document ${idx + 1}: ${docTitle}${pageInfo}]\n${chunk.content}`;
  });

  return contextParts.join("\n\n---\n\n");
}

export function buildSystemPrompt(source: "archive" | "web", context: string): string {
  if (source === "archive") {
    return `You are a helpful assistant. Answer using the documents below.

FORMATTING RULES (CRITICAL):
1. Citations: Use ONLY [1], [2], [3] format. NEVER use "Document 1", "[Doc 1]", or any other format.
2. Lists: Use sequential numbering (1. 2. 3.), NEVER use (1. 1. 1.) or bullet points.
3. Place citations at sentence end: "This is a fact [1]."
4. Line breaks: Use blank lines between paragraphs and before/after lists. Each list item should be on its own line.
5. Structure: Start with a brief summary, then provide detailed points with proper spacing.

DOCUMENTS:
${context}`;
  }

  return `You are an AI assistant for Index.ai.
The user's question could not be answered from the archive, so web search results are provided.

IMPORTANT: Start your response by noting that this information comes from web search, not the curated archive.

Web Search Results:
${context}

Rules:
1. Clearly indicate this is from web search
2. Be helpful but note the information may be less reliable than archive content
3. Cite sources when possible`;
}

// Post-process AI output to fix common formatting issues
export function cleanAnswerFormat(answer: string): string {
  // First: normalize citation formats to [N]
  let cleaned = normalizeCitations(answer);

  // Remove invalid citation fragments
  cleaned = removeInvalidCitationFragments(cleaned);

  // Apply text formatting fixes
  cleaned = cleaned
    // Fix orphan list markers: ". text" at line start -> remove
    .replace(/^\.(\s+)/gm, "$1")
    // Fix lines starting with Chinese punctuation
    .replace(/^[，,。、：:]\s*/gm, "")
    // Normalize bullet points to numbered list (convert - * • to context-aware format)
    .replace(/^[-*•·]\s+(.+)$/gm, (_, content) => content)
    // Fix "1.text" -> "1. text" (add space after number)
    .replace(/^(\d+)\.([^\s])/gm, "$1. $2")
    // Remove empty list items
    .replace(/^\d+[.)]\s*$/gm, "")
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Finally: renumber lists to ensure sequential 1. 2. 3.
  return renumberLists(cleaned);
}

