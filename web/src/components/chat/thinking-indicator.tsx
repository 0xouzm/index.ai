"use client";

import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  className?: string;
}

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%]">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70",
            "text-white"
          )}>
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Index AI
          </span>
        </div>

        <div className={cn(
          "rounded-2xl px-5 py-4",
          "bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm rounded-bl-md"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
            </div>
            <span className="text-sm text-[var(--color-foreground)] font-medium">
              Generating response
              <span className="inline-flex ml-1">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
