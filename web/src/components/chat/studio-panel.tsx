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
    <div className={cn("flex flex-col h-full bg-[var(--color-background)]", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold tracking-wide text-[var(--color-foreground)]">
          {t("studio.title")}
        </h2>
        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center",
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
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5",
                "border border-[var(--color-accent)]/20"
              )}>
                <svg className="w-5 h-5 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-[var(--color-foreground)]">
                  {collection.title}
                </h3>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  By {collection.by}
                </p>
              </div>
            </div>

            {collection.summary && (
              <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">
                {collection.summary}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <h4 className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
              {t("studio.collectionStats")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-muted)]">
                <p className="text-lg font-display font-bold text-[var(--color-foreground)]">
                  {collection.documents.length}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{t("studio.totalSources")}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-muted)]">
                <p className="text-lg font-display font-bold text-[var(--color-foreground)]">
                  {selectedDocIds.size}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{t("studio.selected")}</p>
              </div>
            </div>
          </div>

          {/* Selected Sources Details */}
          {selectedDocs.length > 0 && (
            <div className="p-4 border-b border-[var(--color-border)]">
              <h4 className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                {t("studio.activeContext")}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">{t("studio.chunks")}</span>
                  <span className="font-medium text-[var(--color-foreground)]">{totalChunks.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">{t("studio.tokens")}</span>
                  <span className="font-medium text-[var(--color-foreground)]">{totalTokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4">
            <h4 className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
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
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
                    "text-sm text-left",
                    "bg-[var(--color-muted)] hover:bg-[var(--color-accent)]/10",
                    "hover:text-[var(--color-accent)] transition-colors",
                    "border border-transparent hover:border-[var(--color-accent)]/20"
                  )}
                >
                  <span>{action.icon}</span>
                  <span>{t(`suggestions.${action.labelKey}`)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 mt-auto border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
            <p className="text-xs text-[var(--color-muted-foreground)] text-center">
              {t("studio.poweredBy")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
