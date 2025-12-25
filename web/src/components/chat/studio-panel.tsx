"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Collection, Document } from "@/types";

interface StudioPanelProps {
  collection: Collection & { documents: Document[] };
  selectedDocIds: Set<string>;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onSuggestionClick?: (prompt: string) => void;
  className?: string;
}

export function StudioPanel({
  collection,
  selectedDocIds,
  isCollapsed,
  onToggle,
  onSuggestionClick,
  className,
}: StudioPanelProps) {
  const t = useTranslations("chat");
  const selectedDocs = collection.documents.filter((d) => selectedDocIds.has(d.id));
  const totalTokens = selectedDocs.reduce((sum, d) => sum + (d.tokenCount || 0), 0);
  const totalChunks = selectedDocs.reduce((sum, d) => sum + (d.chunkCount || 0), 0);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h2 className="font-display text-base font-semibold text-[var(--color-foreground)]">
            {t("studio.title")}
          </h2>
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              "hover:bg-[var(--color-muted)] transition-colors"
            )}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            <svg
              className={cn("w-4 h-4 text-[var(--color-muted-foreground)] transition-transform", !isCollapsed && "rotate-180")}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {/* Collection Summary */}
          <div className="px-5 pb-5">
            <div className="p-4 rounded-2xl bg-[var(--color-muted)]">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-[var(--color-accent)] to-[#FF8E8E]",
                  "shadow-sm"
                )}>
                  <span className="text-white text-xl">📚</span>
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-[var(--color-foreground)] leading-snug">
                    {collection.title}
                  </h3>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    By {collection.by}
                  </p>
                </div>
              </div>

              {collection.summary && (
                <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed line-clamp-3">
                  {collection.summary}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 pb-5">
            <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 flex items-center gap-1.5">
              <span>📊</span>
              {t("studio.collectionStats")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[var(--color-muted)] text-center">
                <p className="text-2xl font-display font-bold text-[var(--color-foreground)]">
                  {collection.documents.length}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{t("studio.totalSources")}</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-accent-soft)] text-center">
                <p className="text-2xl font-display font-bold text-[var(--color-accent)]">
                  {selectedDocIds.size}
                </p>
                <p className="text-xs text-[var(--color-accent)]/70 mt-0.5">{t("studio.selected")}</p>
              </div>
            </div>
          </div>

          {/* Selected Sources Details */}
          {selectedDocs.length > 0 && (
            <div className="px-5 pb-5">
              <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 flex items-center gap-1.5">
                <span>⚡</span>
                {t("studio.activeContext")}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-muted)]">
                  <span className="text-sm text-[var(--color-muted-foreground)]">{t("studio.chunks")}</span>
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">{totalChunks.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-muted)]">
                  <span className="text-sm text-[var(--color-muted-foreground)]">{t("studio.tokens")}</span>
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">{totalTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-5 pb-5">
            <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 flex items-center gap-1.5">
              <span>💡</span>
              {t("studio.suggestions")}
            </h4>
            <div className="space-y-2">
              {[
                { icon: "📝", labelKey: "summarize" as const, prompt: "Please summarize the selected documents, highlighting the main themes and key takeaways." },
                { icon: "🔍", labelKey: "insights" as const, prompt: "What are the key insights and important findings from these documents?" },
                { icon: "📊", labelKey: "compare" as const, prompt: "Compare and contrast the main ideas across the selected documents." },
                { icon: "❓", labelKey: "faq" as const, prompt: "Generate a list of frequently asked questions based on these documents with brief answers." },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(action.prompt)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                    "text-sm text-left",
                    "bg-[var(--color-muted)] hover:bg-[var(--color-accent-soft)]",
                    "hover:text-[var(--color-accent)]",
                    "transition-all duration-200"
                  )}
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="font-medium">{t(`suggestions.${action.labelKey}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-5 py-4 mt-auto border-t border-[var(--color-border)]">
            <p className="text-xs text-center text-[var(--color-muted-foreground)]">
              {t("studio.poweredBy")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
