"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";

interface InlineCitationProps {
  citation: Citation;
  index: number;
}

export function InlineCitation({ citation, index }: InlineCitationProps) {
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: "left" | "center" | "right"; y: "above" | "below" }>({ x: "center", y: "above" });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearCloseTimeout();
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const handleMouseLeave = useCallback(() => {
    clearCloseTimeout();
    // Delay closing to allow mouse to move to tooltip
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, [clearCloseTimeout]);

  useEffect(() => {
    return () => clearCloseTimeout();
  }, [clearCloseTimeout]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;

      // Tooltip width is 380px, need at least half (190px) + margin
      // Left sidebar is ~280px, so need more space on left side
      const tooltipHalfWidth = 200;

      setPosition({
        y: spaceAbove > 300 || spaceAbove > spaceBelow ? "above" : "below",
        x: spaceLeft < tooltipHalfWidth ? "left" : spaceRight < tooltipHalfWidth ? "right" : "center",
      });
    }
  }, [isOpen]);

  // Show more content - up to 800 chars to display complete paragraph
  const previewContent = citation.chunkContent && citation.chunkContent.length > 800
    ? citation.chunkContent.slice(0, 800) + "..."
    : citation.chunkContent || t("message.noContent");

  const displayNum = index + 1;

  return (
    <span
      ref={containerRef}
      className="relative inline-flex align-baseline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        ref={triggerRef}
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

      {isOpen && (
        <div
          className={cn(
            "absolute z-[100] w-[380px]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            position.y === "above" ? "bottom-full mb-2" : "top-full mt-2",
            position.x === "left" ? "left-0" : position.x === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
          )}
        >
          <div className={cn("bg-[var(--color-card)] rounded-lg shadow-2xl shadow-black/20 border border-[var(--color-border)] overflow-hidden")}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-foreground)] leading-tight">{citation.documentTitle}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {t("message.sourceNum", { num: index + 1 })}
                    {citation.page && ` · ${t("message.page", { num: citation.page })}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 py-3 max-h-[280px] overflow-y-auto">
              <p className="text-sm text-[var(--color-foreground)]/85 leading-relaxed whitespace-pre-wrap">
                &ldquo;{previewContent}&rdquo;
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 rotate-45 bg-[var(--color-card)] border-[var(--color-border)]",
              position.y === "above" ? "bottom-0 translate-y-1.5 border-r border-b" : "top-0 -translate-y-1.5 border-l border-t",
              position.x === "left" ? "left-4" : position.x === "right" ? "right-4" : "left-1/2 -translate-x-1/2"
            )}
          />
        </div>
      )}
    </span>
  );
}
