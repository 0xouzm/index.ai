"use client";

import { useState, useRef, useEffect, Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType, Citation } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

// Inline Citation Link with Hover Tooltip - NotebookLM style numbered badge
function InlineCitation({
  citation,
  index,
}: {
  citation: Citation;
  index: number;
}) {
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: "left" | "center" | "right"; y: "above" | "below" }>({ x: "center", y: "above" });
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      setPosition({
        y: spaceAbove > 220 || spaceAbove > spaceBelow ? "above" : "below",
        x: spaceLeft < 160 ? "left" : spaceRight < 160 ? "right" : "center",
      });
    }
  }, [isOpen]);

  // Truncate content for preview
  const previewContent = citation.chunkContent && citation.chunkContent.length > 300
    ? citation.chunkContent.slice(0, 300) + "..."
    : citation.chunkContent || t("message.noContent");

  // Display number (1-based)
  const displayNum = index + 1;

  return (
    <span className="relative inline-flex align-baseline">
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn(
          "inline-flex items-center justify-center cursor-help",
          "w-5 h-5 text-[10px] font-semibold rounded-full",
          "bg-[var(--color-accent)] text-white",
          "hover:bg-[var(--color-accent)]/80 hover:scale-110",
          "transition-all duration-150",
          "ml-0.5 -translate-y-0.5"
        )}
        title={citation.documentTitle}
      >
        {displayNum}
      </span>

      {/* Tooltip */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-[100] w-[340px]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            position.y === "above" ? "bottom-full mb-2" : "top-full mt-2",
            position.x === "left" ? "left-0" : position.x === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
          )}
        >
          <div
            className={cn(
              "bg-[var(--color-card)] rounded-lg",
              "shadow-2xl shadow-black/20",
              "border border-[var(--color-border)]",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] leading-tight">
                    {citation.documentTitle}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {t("message.sourceNum", { num: index + 1 })}
                    {citation.page && ` · ${t("message.page", { num: citation.page })}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3 max-h-[200px] overflow-y-auto">
              <p className="text-sm text-[var(--color-foreground)]/85 leading-relaxed whitespace-pre-wrap">
                &ldquo;{previewContent}&rdquo;
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 rotate-45",
              "bg-[var(--color-card)] border-[var(--color-border)]",
              position.y === "above"
                ? "bottom-0 translate-y-1.5 border-r border-b"
                : "top-0 -translate-y-1.5 border-l border-t",
              position.x === "left" ? "left-4" : position.x === "right" ? "right-4" : "left-1/2 -translate-x-1/2"
            )}
          />
        </div>
      )}
    </span>
  );
}

// Parse content and replace citation references with interactive components
function parseContentWithCitations(
  content: string,
  citations: Citation[]
): ReactNode[] {
  if (!citations || citations.length === 0) {
    // Even without citations, clean up invalid [Document] references
    const cleaned = content.replace(/\[?\s*Doc(?:ument)?\s*\]|\bDocument\s*\]/gi, "");
    return [cleaned];
  }

  const result: ReactNode[] = [];

  // Combined pattern that matches:
  // 1. Valid citations with numbers: [1], [Document 1], [Doc 1], etc.
  // 2. Invalid citations without numbers: [Document], [Doc], etc. (to remove them)
  // Pattern breakdown:
  // - Group 1: Numbered citation - [Document X], [Doc X], [X], Document X]
  // - Group 2: The actual number from numbered citation
  // - Group 3: Invalid citation without number - [Document], [Doc]
  const citationPattern = /(\[?\s*(?:Doc(?:ument)?\s*)?(\d+)(?::\s*[^\]]+)?\s*\]|\bDocument\s+(\d+)\])|(\[?\s*Doc(?:ument)?\s*\]|\bDocument\s*\])/gi;

  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = citationPattern.exec(content)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      result.push(
        <Fragment key={`text-${keyIndex++}`}>
          {content.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    // Check if this is an invalid citation (no number) - match[4]
    if (match[4]) {
      // Skip invalid citation - don't add anything to result
      lastIndex = match.index + match[0].length;
      continue;
    }

    // Valid citation with number
    const citationNum = match[2] || match[3];
    const citationIndex = citationNum ? parseInt(citationNum, 10) - 1 : -1;

    if (citationIndex >= 0 && citationIndex < citations.length) {
      const citation = citations[citationIndex];
      result.push(
        <InlineCitation
          key={`citation-${keyIndex++}`}
          citation={citation}
          index={citationIndex}
        />
      );
    }
    // If citation index out of range, just skip it (don't show raw text)

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    result.push(
      <Fragment key={`text-${keyIndex++}`}>
        {content.slice(lastIndex)}
      </Fragment>
    );
  }

  return result.length > 0 ? result : [content];
}

// Simple markdown-like formatting (bold, italic, lists)
function formatText(text: string, citations: Citation[]): ReactNode[] {
  // First parse citations
  const withCitations = parseContentWithCitations(text, citations);

  // Then apply simple formatting to text nodes
  return withCitations.map((node, i) => {
    if (typeof node !== "string") return node;

    // Apply bold formatting
    const parts: ReactNode[] = [];
    const boldPattern = /\*\*([^*]+)\*\*/g;
    let lastIdx = 0;
    let m;

    while ((m = boldPattern.exec(node)) !== null) {
      if (m.index > lastIdx) {
        parts.push(node.slice(lastIdx, m.index));
      }
      parts.push(<strong key={`bold-${i}-${m.index}`} className="font-semibold">{m[1]}</strong>);
      lastIdx = m.index + m[0].length;
    }

    if (lastIdx < node.length) {
      parts.push(node.slice(lastIdx));
    }

    return parts.length > 0 ? <Fragment key={`fmt-${i}`}>{parts}</Fragment> : node;
  });
}

// Render content with citations - handles paragraphs and lists
function ContentWithCitations({
  content,
  citations,
  className,
}: {
  content: string;
  citations?: Citation[];
  className?: string;
}) {
  // Split content into paragraphs and list items
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let currentList: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 mb-3 space-y-1">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 mb-3 space-y-1">
            {currentList}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      flushList();
      return;
    }

    // Check for numbered list (1. or 1)
    const olMatch = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      currentList.push(
        <li key={`li-${lineIndex}`} className="leading-relaxed">
          {formatText(olMatch[2], citations || [])}
        </li>
      );
      return;
    }

    // Check for bullet list (- or *)
    const ulMatch = trimmed.match(/^[-*]\s*(.+)$/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      currentList.push(
        <li key={`li-${lineIndex}`} className="leading-relaxed">
          {formatText(ulMatch[1], citations || [])}
        </li>
      );
      return;
    }

    // Regular paragraph (using div to avoid hydration errors with nested div in tooltip)
    flushList();
    elements.push(
      <div key={`p-${lineIndex}`} className="mb-3 last:mb-0 leading-relaxed">
        {formatText(trimmed, citations || [])}
      </div>
    );
  });

  // Flush any remaining list
  flushList();

  return <div className={cn("prose-content", className)}>{elements}</div>;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const t = useTranslations("chat");
  const isUser = message.role === "user";
  const isLoading = message.role === "assistant" && message.content === "";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start", className)}>
      <div className={cn("max-w-[85%]", isUser ? "order-2" : "order-1")}>
        {/* Avatar/Icon */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70",
              "text-white"
            )}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {t("message.assistant")}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            isUser
              ? "bg-[var(--color-foreground)] text-[var(--color-background)] rounded-br-md"
              : "bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm rounded-bl-md"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ContentWithCitations
              content={message.content}
              citations={message.citations}
              className="text-sm"
            />
          )}
        </div>

        {/* Source Badge */}
        {!isUser && message.source && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              message.source === "archive"
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}>
              {message.source === "archive" ? (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                  {t("message.archive")}
                </>
              ) : (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  {t("message.web")}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
