"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";
import { InlineCitation } from "./inline-citation";

// Normalize citation formats to standard [N] format
function normalizeCitations(text: string): string {
  return text
    // [Document N: ...] or [Doc N: ...] or [Document N] -> [N]
    .replace(/\[\s*(?:Doc(?:ument)?\s*)?(\d+)\s*(?::[^\]]+)?\s*\]/gi, "[$1]")
    // Document N] or Doc N] (missing left bracket) -> [N]
    .replace(/\bDoc(?:ument)?\s*(\d+)\s*\]/gi, "[$1]")
    // Remove orphaned "Document" or "Doc" not followed by valid format
    .replace(/\bDoc(?:ument)?\s*(?!\d)/gi, "");
}

// Parse content and replace citation references with interactive components
// Returns mixed array of strings (to be formatted) and ReactNodes (citations)
function parseContentWithCitations(content: string, citations: Citation[]): (string | ReactNode)[] {
  // Normalize citation formats for robust parsing
  const normalized = normalizeCitations(content);

  if (!citations || citations.length === 0) {
    // Remove citation markers like [1], [2] when no citations data
    return [normalized.replace(/\[\d+\]/g, "")];
  }

  const result: (string | ReactNode)[] = [];
  // Simple pattern - only match normalized [N] format
  const citationPattern = /\[(\d+)\]/g;

  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = citationPattern.exec(normalized)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      result.push(normalized.slice(lastIndex, match.index));
    }

    const citationIndex = parseInt(match[1], 10) - 1;

    if (citationIndex >= 0 && citationIndex < citations.length) {
      // Valid citation - show badge
      result.push(<InlineCitation key={`citation-${keyIndex++}`} citation={citations[citationIndex]} index={citationIndex} />);
    }
    // Invalid citation (out of range) - just skip it, don't keep the text

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < normalized.length) {
    result.push(normalized.slice(lastIndex));
  }

  return result.length > 0 ? result : [normalized];
}

// Apply inline formatting (bold, italic) to text
function applyInlineFormatting(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIdx = 0;
  let m;
  let keyIdx = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index));
    }
    if (m[1]) {
      parts.push(<strong key={`${keyPrefix}-b-${keyIdx++}`} className="font-semibold">{m[1]}</strong>);
    } else if (m[2]) {
      parts.push(<em key={`${keyPrefix}-i-${keyIdx++}`}>{m[2]}</em>);
    }
    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}

// Format text with citations and inline styles
function formatText(text: string, citations: Citation[]): ReactNode[] {
  const withCitations = parseContentWithCitations(text, citations);
  return withCitations.flatMap((node, i) => {
    if (typeof node !== "string") return node;
    return applyInlineFormatting(node, `fmt-${i}`);
  });
}

interface MessageContentProps {
  content: string;
  citations?: Citation[];
  className?: string;
}

// Clean up malformed content from AI
function cleanContent(content: string): string {
  // First: normalize citation formats (fallback layer, should already be done by backend)
  let cleaned = normalizeCitations(content)
    // Remove orphan dots at line start: ". text" or "。text"
    .replace(/^[.。]\s*/gm, "")
    // Remove Chinese/English punctuation at line start
    .replace(/^[，,、：:；;]\s*/gm, "")
    // Remove incomplete numbered items
    .replace(/^\d+[.)]\s*$/gm, "")
    // Normalize bullet markers
    .replace(/^[·•]\s+/gm, "- ")
    // Fix "1.text" -> "1. text"
    .replace(/^(\d+)\.([^\s\d])/gm, "$1. $2")
    // Fix "5 **text**" -> "5. **text**" (number without punctuation before bold)
    .replace(/^(\d+)\s+(\*\*)/gm, "$1. $2")
    // Clean excessive blank lines
    .replace(/\n{3,}/g, "\n\n");

  // Normalize list numbering and convert standalone bold headers to list items
  const lines = cleaned.split("\n");
  const result: string[] = [];
  let listCounter = 0;
  let hasSeenNumberedItem = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for numbered list item
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      hasSeenNumberedItem = true;
      listCounter++;
      // Renumber to ensure sequential numbering
      result.push(`${listCounter}. ${numMatch[2]}`);
      continue;
    }

    // Check for bold header that should be a list item (when we're in a list context)
    // Pattern: starts with ** and ends with **: or **：
    if (hasSeenNumberedItem && /^\*\*[^*]+\*\*[：:]/.test(trimmed)) {
      listCounter++;
      result.push(`${listCounter}. ${trimmed}`);
      continue;
    }

    // Empty line resets list context
    if (!trimmed) {
      if (hasSeenNumberedItem) {
        hasSeenNumberedItem = false;
        listCounter = 0;
      }
      result.push(line);
      continue;
    }

    // Regular line
    result.push(line);
  }

  return result.join("\n").trim();
}

export function MessageContent({ content, citations, className }: MessageContentProps) {
  const cleanedContent = cleanContent(content);
  const lines = cleanedContent.split("\n");
  const elements: ReactNode[] = [];
  let currentList: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let listStartNum = 1;

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`ol-${elements.length}`} start={listStartNum} className="list-decimal pl-6 mb-4 space-y-2">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 mb-4 space-y-2">
            {currentList}
          </ul>
        );
      }
      currentList = [];
      listType = null;
      listStartNum = 1;
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Match numbered list: "1. text" or "1) text"
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      const num = parseInt(olMatch[1], 10);
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        listStartNum = num;
      }
      currentList.push(
        <li key={`li-${lineIndex}`} className="leading-relaxed pl-1">
          {formatText(olMatch[2], citations || [])}
        </li>
      );
      return;
    }

    // Match bullet list: "- text", "* text", "• text"
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(
        <li key={`li-${lineIndex}`} className="leading-relaxed pl-1">
          {formatText(ulMatch[1], citations || [])}
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <div key={`p-${lineIndex}`} className="mb-4 last:mb-0 leading-relaxed">
        {formatText(trimmed, citations || [])}
      </div>
    );
  });

  flushList();

  return <div className={cn("prose-content", className)}>{elements}</div>;
}
