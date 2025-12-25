"use client";

import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  className?: string;
}

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3]",
            "shadow-sm"
          )}>
            <span className="text-white text-sm animate-pulse">✨</span>
          </div>
          <span className="text-xs font-semibold text-[var(--color-foreground)]">
            Index AI
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            Thinking
          </span>
        </div>

        <div className={cn(
          "rounded-2xl rounded-bl-lg px-5 py-4",
          "bg-white shadow-sm"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]/40 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-[var(--color-muted-foreground)]">
              Generating response...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
