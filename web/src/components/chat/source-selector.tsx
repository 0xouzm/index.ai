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
  onDocumentClick?: (doc: Document) => void;
  className?: string;
}

// Document type icons with softer styling
function DocumentIcon({ type }: { type: string }) {
  switch (type) {
    case "pdf":
      return <span className="text-base">📄</span>;
    case "url":
      return <span className="text-base">🔗</span>;
    case "markdown":
      return <span className="text-base">📝</span>;
    default:
      return <span className="text-base">📁</span>;
  }
}

// Checkbox component with rounded, friendly styling
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
        "w-5 h-5 rounded-md flex items-center justify-center",
        "transition-all duration-200 flex-shrink-0",
        checked || indeterminate
          ? "bg-[var(--color-accent)] shadow-sm"
          : "bg-[var(--color-muted)] group-hover:bg-[var(--color-accent)]/20"
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
  onDocumentClick,
  className,
}: SourceSelectorProps) {
  const t = useTranslations("chat");
  const allSelected = documents.length > 0 && selectedIds.size === documents.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < documents.length;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="font-display text-base font-semibold text-[var(--color-foreground)]">
              {t("sources.title")}
            </h2>
          </div>
          <button
            onClick={onAddClick}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-[var(--color-accent)] text-white",
              "hover:bg-[#FF5252] hover:scale-105",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200"
            )}
            aria-label="Add source"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Select All */}
      <div className="px-5 pb-3">
        <button
          onClick={onToggleAll}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group",
            "bg-[var(--color-muted)] hover:bg-[var(--color-border)]",
            "transition-colors duration-200"
          )}
        >
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
          />
          <span className="text-sm font-medium text-[var(--color-foreground)]">{t("sources.selectAll")}</span>
          <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
            {selectedIds.size}/{documents.length}
          </span>
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-3">
        {documents.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-muted)] flex items-center justify-center">
              <span className="text-3xl">📭</span>
            </div>
            <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">
              No sources yet
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
              {t("sources.noSources")}
            </p>
            <button
              onClick={onAddClick}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold rounded-full",
                "bg-[var(--color-accent)] text-white",
                "hover:bg-[#FF5252] shadow-sm hover:shadow-md",
                "transition-all duration-200"
              )}
            >
              {t("sources.addSource")}
            </button>
          </div>
        ) : (
          <ul className="space-y-2 pb-4">
            {documents.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              return (
                <li key={doc.id}>
                  <div
                    className={cn(
                      "w-full flex items-start gap-3 px-3 py-3 rounded-xl group",
                      "transition-all duration-200",
                      isSelected
                        ? "bg-[var(--color-accent-soft)]"
                        : "hover:bg-[var(--color-muted)]"
                    )}
                  >
                    <button
                      onClick={() => onToggle(doc.id)}
                      className="flex-shrink-0 mt-0.5"
                    >
                      <Checkbox checked={isSelected} />
                    </button>
                    <button
                      onClick={() => onDocumentClick?.(doc)}
                      className="flex-1 flex items-start gap-3 text-left min-w-0"
                    >
                      <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                        isSelected ? "bg-white shadow-sm" : "bg-[var(--color-muted)]"
                      )}>
                        <DocumentIcon type={doc.sourceType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate leading-snug",
                          isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-foreground)]"
                        )}>
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-medium rounded-full",
                            "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          )}>
                            {(doc.sourceType || "file").toUpperCase()}
                          </span>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            {doc.chunkCount || 0} chunks
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)]" />
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
              {t("sources.of", { selected: selectedIds.size, total: documents.length })}
            </p>
          </div>
          <button
            onClick={onAddClick}
            className="text-xs font-medium text-[var(--color-accent)] hover:underline"
          >
            + Add more
          </button>
        </div>
      </div>
    </div>
  );
}
