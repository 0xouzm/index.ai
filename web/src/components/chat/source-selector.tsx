"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Document } from "@/types";

interface SourceSelectorProps {
  documents: Document[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onAddClick: () => void;
  className?: string;
}

// Document type icons
function DocumentIcon({ type }: { type: string }) {
  const iconClass = "w-4 h-4";

  switch (type) {
    case "pdf":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18h10v-2H7v2zM7 14h10v-2H7v2zM7 10h10V8H7v2zM3 22V2h12l6 6v14H3zm12-15V4H5v16h14V7h-4z"/>
        </svg>
      );
    case "url":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      );
    case "markdown":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.89v6.38h1.92zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z"/>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        </svg>
      );
  }
}

// Checkbox component - using div instead of button to avoid nesting issues
function Checkbox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-[18px] h-[18px] rounded border-2 flex items-center justify-center",
        "transition-all duration-150 flex-shrink-0",
        checked || indeterminate
          ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
          : "border-[var(--color-border)] group-hover:border-[var(--color-accent)]/50"
      )}
      aria-checked={indeterminate ? "mixed" : checked}
      role="checkbox"
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {indeterminate && !checked && (
        <div className="w-2.5 h-0.5 bg-white rounded-full" />
      )}
    </div>
  );
}

export function SourceSelector({
  documents,
  selectedIds,
  onToggle,
  onToggleAll,
  onAddClick,
  className,
}: SourceSelectorProps) {
  const t = useTranslations("chat");
  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < documents.length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-sm font-semibold tracking-wide text-[var(--color-foreground)]">
            {t("sources.title")}
          </h2>
          <button
            onClick={onAddClick}
            className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center",
              "bg-[var(--color-muted)] hover:bg-[var(--color-accent)] hover:text-white",
              "transition-colors"
            )}
            aria-label="Add source"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Select All */}
      <div className="px-4 py-2 border-b border-[var(--color-border)]">
        <button
          onClick={onToggleAll}
          className={cn(
            "w-full flex items-center gap-3 py-1.5 group",
            "text-sm text-[var(--color-foreground)]",
            "hover:text-[var(--color-accent)] transition-colors"
          )}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
          />
          <span className="font-medium">{t("sources.selectAll")}</span>
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto py-2">
        {documents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {t("sources.noSources")}
            </p>
            <button
              onClick={onAddClick}
              className={cn(
                "mt-3 px-4 py-1.5 text-sm font-medium",
                "bg-[var(--color-accent)] text-white rounded-md",
                "hover:bg-[var(--color-accent)]/90 transition-colors"
              )}
            >
              {t("sources.addSource")}
            </button>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              return (
                <li key={doc.id}>
                  <button
                    onClick={() => onToggle(doc.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-2.5 group",
                      "text-left transition-colors",
                      isSelected
                        ? "bg-[var(--color-accent)]/5"
                        : "hover:bg-[var(--color-muted)]"
                    )}
                  >
                    <Checkbox checked={isSelected} />
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                      "bg-[var(--color-muted)]",
                      isSelected && "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    )}>
                      <DocumentIcon type={doc.sourceType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-foreground)]"
                      )}>
                        {doc.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {doc.sourceType.toUpperCase()} · {doc.chunkCount} chunks
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {t("sources.of", { selected: selectedIds.size, total: documents.length })}
        </p>
      </div>
    </div>
  );
}
