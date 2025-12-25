"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";

interface CitationTooltipProps {
  citation: Citation;
  index: number;
  className?: string;
}

export function CitationTooltip({ citation, index, className }: CitationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      setPosition(spaceAbove > 200 || spaceAbove > spaceBelow ? "above" : "below");
    }
  }, [isOpen]);

  // Truncate content for preview
  const previewContent = citation.chunkContent.length > 280
    ? citation.chunkContent.slice(0, 280) + "..."
    : citation.chunkContent;

  return (
    <span className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={cn(
          "inline-flex items-center justify-center",
          "w-[18px] h-[18px] text-[10px] font-semibold",
          "bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
          "rounded-full align-super -translate-y-0.5",
          "hover:bg-[var(--color-accent)]/25 transition-colors",
          "cursor-help"
        )}
        aria-label={`Citation ${index + 1}: ${citation.documentTitle}`}
      >
        {index + 1}
      </button>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "absolute z-50 w-[320px]",
          "opacity-0 pointer-events-none scale-95",
          "transition-all duration-200 ease-out",
          isOpen && "opacity-100 pointer-events-auto scale-100",
          position === "above"
            ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
            : "top-full mt-2 left-1/2 -translate-x-1/2"
        )}
      >
        <div
          className={cn(
            "bg-[var(--color-card)] rounded-lg",
            "shadow-xl shadow-black/10",
            "border border-[var(--color-border)]",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 w-6 h-6 rounded bg-[var(--color-accent)]/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--color-foreground)] truncate">
                  {citation.documentTitle}
                </p>
                {citation.page && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    Page {citation.page}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">
              &ldquo;{previewContent}&rdquo;
            </p>
          </div>

          {/* Footer - Optional link */}
          <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Source #{index + 1}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            "w-3 h-3 rotate-45",
            "bg-[var(--color-card)] border-[var(--color-border)]",
            position === "above"
              ? "bottom-0 translate-y-1.5 border-r border-b"
              : "top-0 -translate-y-1.5 border-l border-t"
          )}
        />
      </div>
    </span>
  );
}
