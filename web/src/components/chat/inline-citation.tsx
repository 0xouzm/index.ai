"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Citation } from "@/types";

interface InlineCitationProps {
  citation: Citation;
  index: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number;
  showAbove: boolean;
  viewportHeight: number;
}

export function InlineCitation({ citation, index }: InlineCitationProps) {
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
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
      const tooltipWidth = 380;
      const tooltipHeight = 350; // approximate max height
      const margin = 12;

      // Calculate ideal center position
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;

      // Clamp to viewport bounds
      const minLeft = margin;
      const maxLeft = window.innerWidth - tooltipWidth - margin;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      // Calculate arrow position relative to tooltip
      const arrowLeft = rect.left + rect.width / 2 - left;

      // Determine if should show above or below
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceAbove > tooltipHeight || spaceAbove > spaceBelow;

      const top = showAbove
        ? rect.top - margin
        : rect.bottom + margin;

      setPosition({ top, left, arrowLeft, showAbove, viewportHeight: window.innerHeight });
    }
  }, [isOpen]);

  // Format markdown content for display
  const formatMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split("\n");
    const result: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        result.push(<br key={`br-${i}`} />);
        return;
      }

      // Headers
      if (trimmed.startsWith("### ")) {
        result.push(<div key={`h3-${i}`} className="font-semibold text-sm mt-2 mb-1">{trimmed.slice(4)}</div>);
        return;
      }
      if (trimmed.startsWith("## ")) {
        result.push(<div key={`h2-${i}`} className="font-semibold text-sm mt-3 mb-1">{trimmed.slice(3)}</div>);
        return;
      }
      if (trimmed.startsWith("# ")) {
        result.push(<div key={`h1-${i}`} className="font-bold text-base mt-3 mb-1">{trimmed.slice(2)}</div>);
        return;
      }

      // List items
      if (/^[-*•]\s+/.test(trimmed)) {
        result.push(<div key={`li-${i}`} className="pl-3 before:content-['•'] before:mr-2 before:text-[var(--color-muted-foreground)]">{trimmed.replace(/^[-*•]\s+/, "")}</div>);
        return;
      }

      // Regular text with inline formatting
      let formatted: React.ReactNode = trimmed;
      // Bold
      if (trimmed.includes("**")) {
        const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
        formatted = parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part);
      }

      result.push(<div key={`p-${i}`}>{formatted}</div>);
    });

    return result;
  };

  // Show full content - up to 1500 chars for complete paragraphs with context
  // Normalize line endings for consistent display
  const normalizedContent = citation.chunkContent
    ? citation.chunkContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    : null;
  const previewContent = normalizedContent && normalizedContent.length > 1500
    ? normalizedContent.slice(0, 1500) + "..."
    : normalizedContent || t("message.noContent");

  // Use sourceIndex directly for display (already 1-based)
  const displayNum = citation.sourceIndex;

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

      {isOpen && position && (
        <div
          className="fixed z-[100] w-[380px] animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: position.showAbove ? "auto" : position.top,
            bottom: position.showAbove ? `${position.viewportHeight - position.top}px` : "auto",
            left: position.left,
          }}
        >
          <div className="bg-[var(--color-card)] rounded-lg shadow-2xl shadow-black/20 border border-[var(--color-border)] overflow-hidden">
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
              <div className="text-sm text-[var(--color-foreground)]/85 leading-relaxed">
                {formatMarkdown(previewContent)}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={cn(
              "absolute w-3 h-3 rotate-45 bg-[var(--color-card)] border-[var(--color-border)]",
              position.showAbove ? "bottom-0 translate-y-1.5 border-r border-b" : "top-0 -translate-y-1.5 border-l border-t"
            )}
            style={{ left: Math.max(12, Math.min(position.arrowLeft - 6, 380 - 24)) }}
          />
        </div>
      )}
    </span>
  );
}
