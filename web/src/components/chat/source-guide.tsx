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

export function SourceGuide({ document: initialDocument, onBack, onDocumentUpdate, className }: SourceGuideProps) {
  const t = useTranslations("chat");
  const [document, setDocument] = useState(initialDocument);
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    setDocument(initialDocument);
  }, [initialDocument]);

  const topics: string[] = Array.isArray(document.topics)
    ? document.topics
    : typeof document.topics === "string" ? JSON.parse(document.topics || "[]") : [];

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
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors"
          aria-label="Back to sources"
        >
          <svg className="w-4 h-4 text-[var(--color-muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="font-display text-base font-semibold text-[var(--color-foreground)]">
          {t("sources.title")}
        </h2>
      </div>

      {/* Document Info */}
      <div className="flex-shrink-0 px-5 pb-4">
        <div className="p-4 rounded-2xl bg-[var(--color-muted)]">
          <h3 className="font-display text-base font-semibold text-[var(--color-foreground)] leading-snug">
            {document.title}
          </h3>
          {document.sourceUrl && (
            <a
              href={document.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--color-accent)] hover:underline"
            >
              <span>🔗</span>
              {new URL(document.sourceUrl).hostname.replace("www.", "")}
            </a>
          )}
        </div>
      </div>

      {/* AI Guide Card */}
      <div className="flex-shrink-0 px-5 pb-4 max-h-[35%] overflow-y-auto">
        <div className="rounded-2xl bg-[var(--color-accent-soft)] overflow-hidden">
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--color-accent)]/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <span className="font-medium text-sm text-[var(--color-foreground)]">{t("sources.guide")}</span>
            </div>
            <svg className={cn("w-4 h-4 text-[var(--color-accent)] transition-transform", isGuideExpanded && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {isGuideExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[var(--color-muted-foreground)]">Analyzing...</span>
                </div>
              ) : hasSummary ? (
                <>
                  <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">{document.summary}</p>
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic, idx) => (
                        <span key={idx} className="px-3 py-1 text-xs font-medium rounded-full bg-white text-[var(--color-foreground)]/70 shadow-sm">
                          {topic.length > 20 ? topic.slice(0, 20) + "..." : topic}
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
                      <button onClick={handleAnalyze} className="px-4 py-2 text-xs font-semibold rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors">
                        Retry
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleAnalyze} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm transition-colors">
                      <span>✨</span>
                      Generate Summary
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📖</span>
          <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Content</h4>
          {document.createdAt && (
            <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
              {new Date(document.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>
        <ContentRenderer content={document.processedContent || document.content || ""} />
      </div>
    </div>
  );
}

function ContentRenderer({ content }: { content: string }) {
  if (!content) {
    return <p className="text-sm text-[var(--color-muted-foreground)] italic py-4 text-center">No content available</p>;
  }

  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("# ")) {
          return <h2 key={idx} className="text-lg font-bold text-[var(--color-foreground)] mt-6 mb-2">{trimmed.slice(2)}</h2>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={idx} className="text-base font-bold text-[var(--color-foreground)] mt-5 mb-2">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith("### ")) {
          return <h4 key={idx} className="text-sm font-bold text-[var(--color-foreground)] mt-4 mb-2">{trimmed.slice(4)}</h4>;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ul key={idx} className="space-y-1.5 pl-4">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-[var(--color-foreground)]/80 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 flex-shrink-0" />
                  {item.replace(/^[-*]\s*/, "")}
                </li>
              ))}
            </ul>
          );
        }

        return <p key={idx} className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">{trimmed}</p>;
      })}
    </div>
  );
}
