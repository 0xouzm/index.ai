"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { analyzeDocument } from "@/lib/api";
import type { Document } from "@/types";

interface SourceGuideProps {
  document: Document;
  onBack: () => void;
  onDocumentUpdate?: (doc: Document) => void;
  className?: string;
}

// Sparkle icon for the guide header
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" opacity="0.6" />
      <path d="M18 14L18.75 16.25L21 17L18.75 17.75L18 20L17.25 17.75L15 17L17.25 16.25L18 14Z" opacity="0.6" />
    </svg>
  );
}

export function SourceGuide({ document: initialDocument, onBack, onDocumentUpdate, className }: SourceGuideProps) {
  const t = useTranslations("chat");
  const [document, setDocument] = useState(initialDocument);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Update local state when prop changes
  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  // Parse topics from JSON string if needed
  const topics: string[] = Array.isArray(document.topics)
    ? document.topics
    : typeof document.topics === "string"
      ? JSON.parse(document.topics || "[]")
      : [];

  const hasSummary = !!document.summary;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    const result = await analyzeDocument(document.id);

    if (result.error) {
      setAnalyzeError(result.error);
    } else if (result.data?.document) {
      setDocument(result.data.document);
      onDocumentUpdate?.(result.data.document);
    }

    setIsAnalyzing(false);
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
        <button
          onClick={onBack}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center",
            "hover:bg-[var(--color-muted)] transition-colors"
          )}
          aria-label="Back to sources"
        >
          <svg
            className="w-4 h-4 text-[var(--color-muted-foreground)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-display text-sm font-semibold tracking-wide text-[var(--color-foreground)] truncate">
          {t("sources.title")}
        </h2>
      </div>

      {/* Document Title - Fixed */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-display text-lg font-semibold text-[var(--color-foreground)] leading-tight">
          {document.title}
        </h3>
        {document.sourceUrl && (
          <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
            <span className="font-medium">By</span>{" "}
            <a
              href={document.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline"
            >
              {new URL(document.sourceUrl).hostname.replace("www.", "")}
            </a>
          </p>
        )}
      </div>

      {/* Source Guide Card - Fixed with max height */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-[var(--color-border)] max-h-[40%] overflow-y-auto">
        <div
          className={cn(
            "rounded-xl border border-[var(--color-accent)]/20",
            "bg-gradient-to-br from-[var(--color-accent)]/5 to-transparent"
          )}
        >
          {/* Guide Header */}
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3",
              "hover:bg-[var(--color-accent)]/5 transition-colors rounded-t-xl"
            )}
          >
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="font-medium text-sm text-[var(--color-foreground)]">
                {t("sources.guide")}
              </span>
            </div>
            <svg
              className={cn(
                "w-4 h-4 text-[var(--color-muted-foreground)] transition-transform",
                isGuideExpanded && "rotate-180"
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Guide Content */}
          {isGuideExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    Analyzing document...
                  </span>
                </div>
              ) : hasSummary ? (
                <>
                  <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">
                    {document.summary}
                  </p>

                  {/* Topic Tags */}
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {topics.map((topic, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full",
                            "bg-[var(--color-background)] border border-[var(--color-border)]",
                            "text-[var(--color-foreground)]/70"
                          )}
                        >
                          {topic.length > 15 ? topic.slice(0, 15) + "..." : topic}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2">
                  {analyzeError ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-500">{analyzeError}</p>
                      <button
                        onClick={handleAnalyze}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md",
                          "bg-[var(--color-accent)] text-white",
                          "hover:bg-[var(--color-accent)]/90 transition-colors"
                        )}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnalyze}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md",
                        "bg-[var(--color-accent)] text-white",
                        "hover:bg-[var(--color-accent)]/90 transition-colors"
                      )}
                    >
                      <SparkleIcon className="w-4 h-4" />
                      Generate Summary
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-4">
          <h4 className="font-display text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
            Content
          </h4>

          {document.createdAt && (
            <p className="text-xs text-[var(--color-muted-foreground)] italic mb-4">
              {new Date(document.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}

          {/* Processed Content */}
          <div className="prose prose-sm max-w-none text-[var(--color-foreground)]/90">
            <ContentRenderer content={document.processedContent || document.content || ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like content renderer
function ContentRenderer({ content }: { content: string }) {
  if (!content) {
    return (
      <p className="text-[var(--color-muted-foreground)] italic">No content available</p>
    );
  }

  // Split content into paragraphs and render
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        // Check for headings
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={idx} className="text-lg font-bold text-[var(--color-foreground)] mt-6 mb-2">
              {trimmed.slice(2)}
            </h2>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="text-base font-bold text-[var(--color-foreground)] mt-5 mb-2">
              {trimmed.slice(3)}
            </h3>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="text-sm font-bold text-[var(--color-foreground)] mt-4 mb-2">
              {trimmed.slice(4)}
            </h4>
          );
        }

        // Check for list items
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ul key={idx} className="list-disc list-inside space-y-1">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="text-sm">
                  {item.replace(/^[-*]\s*/, "")}
                </li>
              ))}
            </ul>
          );
        }

        // Regular paragraph
        return (
          <p key={idx} className="text-sm leading-relaxed">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}
