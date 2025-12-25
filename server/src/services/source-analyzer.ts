/**
 * Source analyzer service
 * Preprocesses documents with AI to generate clean content, summary, and topics
 */

import type { Env } from "../types/env";

export interface SourceAnalysisResult {
  summary: string;
  topics: string[];
  processedContent: string;
}

// Kimi API (Moonshot AI) - OpenAI compatible
const KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions";
const KIMI_MODEL = "moonshot-v1-32k"; // Use 32k model to handle long documents

const ANALYSIS_PROMPT = `You are a document analyzer. Analyze the following document and provide:

1. **Summary**: A concise summary (2-4 sentences) explaining what this document is about, its key points, and who would benefit from reading it. Write in the same language as the document.

2. **Topics**: Extract 3-6 key topic tags that best represent the document's main themes. Each tag should be 2-5 words. Write tags in the same language as the document.

3. **Processed Content**: Clean and optimize the document content by:
   - REMOVE completely:
     * User comments and discussion sections
     * Social sharing buttons and widget text (Share, Tweet, Like, Follow)
     * Advertisement content and promotional banners
     * Newsletter subscription prompts and email signup forms
     * Cookie consent notices and privacy policy links
     * Navigation menus, breadcrumbs, and sidebar links
     * "Related articles", "You may also like", "Read more" sections
     * Author bio sections at the end of articles
     * Footer links, copyright notices, and site disclaimers
     * Platform-specific UI elements (Substack subscribe, Medium claps, etc.)
     * "X replies", "X comments", "Share2 replies" type indicators
   - KEEP intact:
     * Main article/document body content
     * Headings and subheadings (preserve hierarchy)
     * Code examples, technical content, and data
     * Lists, tables, and structured information
     * Inline citations, references, and quotes
   - FIX formatting:
     * Extra whitespace and broken lines
     * Malformed markdown syntax
   - DO NOT summarize or shorten the main content - keep it complete

Respond in JSON format:
{
  "summary": "string",
  "topics": ["tag1", "tag2", "tag3"],
  "processedContent": "string"
}

DOCUMENT:
`;

/**
 * Analyze a document to extract summary, topics, and clean content
 */
export async function analyzeSource(
  content: string,
  env: Env
): Promise<SourceAnalysisResult> {
  const apiKey = env.KIMI_API_KEY;
  if (!apiKey) {
    console.warn("KIMI_API_KEY not configured, skipping source analysis");
    return {
      summary: "",
      topics: [],
      processedContent: content,
    };
  }

  try {
    // Truncate content to fit 32k model (leave room for prompt and output)
    const maxContentLength = 50000;
    const truncatedContent =
      content.length > maxContentLength
        ? content.slice(0, maxContentLength) + "\n\n[Content truncated...]"
        : content;

    const response = await fetch(KIMI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        max_tokens: 16384,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: ANALYSIS_PROMPT + truncatedContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Kimi API error in source analysis:", error);
      return {
        summary: "",
        topics: [],
        processedContent: content,
      };
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const responseContent = data.choices[0]?.message?.content || "";

    try {
      const result = JSON.parse(responseContent) as SourceAnalysisResult;
      return {
        summary: result.summary || "",
        topics: Array.isArray(result.topics) ? result.topics.slice(0, 6) : [],
        processedContent: result.processedContent || content,
      };
    } catch {
      console.error("Failed to parse source analysis response");
      return {
        summary: "",
        topics: [],
        processedContent: content,
      };
    }
  } catch (error) {
    console.error("Error in source analysis:", error);
    return {
      summary: "",
      topics: [],
      processedContent: content,
    };
  }
}
