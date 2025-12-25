/**
 * URL content extractor using Readability algorithm
 * Extracts clean article content from web pages
 */

import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
}

/**
 * Fetch and extract content from a URL
 */
export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; IndexAI/1.0; +https://index.ai)",
      Accept: "text/html,application/xhtml+xml,text/plain,text/markdown",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  // If not HTML, return as-is
  if (!contentType.includes("text/html")) {
    return {
      title: "",
      content: text,
      textContent: text,
    };
  }

  return extractFromHtml(text, url);
}

/**
 * Extract content from HTML string using Readability
 */
export function extractFromHtml(html: string, baseUrl: string): ExtractedContent {
  const { document } = parseHTML(html);

  // Set base URL for relative links
  const base = document.createElement("base");
  base.href = baseUrl;
  document.head.appendChild(base);

  // Use Readability to extract article
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    // Fallback: return basic text extraction
    const body = document.body?.textContent || "";
    return {
      title: document.title || "",
      content: body.trim(),
      textContent: body.trim(),
    };
  }

  // Convert HTML content to markdown-like format
  const markdownContent = htmlToMarkdown(article.content || "");

  return {
    title: article.title || "",
    content: markdownContent,
    textContent: article.textContent || "",
    excerpt: article.excerpt || undefined,
    byline: article.byline || undefined,
    siteName: article.siteName || undefined,
  };
}

/**
 * Convert HTML to Markdown format
 */
function htmlToMarkdown(html: string): string {
  let markdown = html
    // Headers
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    // Paragraphs
    .replace(/<p[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br[^>]*>/gi, "\n")
    // Lists
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<ul[^>]*>/gi, "")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "")
    .replace(/<\/ol>/gi, "\n")
    // Links
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    // Bold & Italic
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    // Code
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gis, "\n```\n$1\n```\n")
    // Blockquotes
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Clean whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  return markdown;
}
