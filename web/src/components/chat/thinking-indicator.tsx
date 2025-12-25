"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ThinkingPhase = "searching" | "analyzing" | "generating";

interface ThinkingIndicatorProps {
  phase: ThinkingPhase;
  className?: string;
}

const phaseConfig = {
  searching: { icon: "search", duration: 2000 },
  analyzing: { icon: "analyze", duration: 2500 },
  generating: { icon: "generate", duration: 0 },
};

function PhaseIcon({ type, isActive }: { type: string; isActive: boolean }) {
  const baseClass = cn(
    "w-4 h-4 transition-all duration-300",
    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-muted-foreground)]"
  );

  switch (type) {
    case "search":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "analyze":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      );
    case "generate":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      );
    default:
      return null;
  }
}

export function ThinkingIndicator({ phase, className }: ThinkingIndicatorProps) {
  const t = useTranslations("chat");
  const phases: ThinkingPhase[] = ["searching", "analyzing", "generating"];
  const currentIndex = phases.indexOf(phase);

  return (
    <div className={cn("flex justify-start", className)}>
      <div className="max-w-[85%]">
        {/* Avatar */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent)]/70",
            "text-white"
          )}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Index AI
          </span>
        </div>

        {/* Thinking Card */}
        <div className={cn(
          "rounded-2xl px-5 py-4",
          "bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm rounded-bl-md"
        )}>
          <div className="space-y-3">
            {phases.map((p, idx) => {
              const isActive = idx === currentIndex;
              const isCompleted = idx < currentIndex;
              const isPending = idx > currentIndex;

              return (
                <div
                  key={p}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    isPending && "opacity-40"
                  )}
                >
                  {/* Status Indicator */}
                  <div className="relative flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--color-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)]" />
                    )}
                  </div>

                  {/* Icon */}
                  <PhaseIcon type={phaseConfig[p].icon} isActive={isActive || isCompleted} />

                  {/* Text */}
                  <span className={cn(
                    "text-sm transition-colors duration-300",
                    isActive ? "text-[var(--color-foreground)] font-medium" :
                    isCompleted ? "text-[var(--color-muted-foreground)]" :
                    "text-[var(--color-muted-foreground)]"
                  )}>
                    {t(`thinking.${p}`)}
                    {isActive && (
                      <span className="inline-flex ml-1">
                        <span className="animate-bounce [animation-delay:0ms]">.</span>
                        <span className="animate-bounce [animation-delay:150ms]">.</span>
                        <span className="animate-bounce [animation-delay:300ms]">.</span>
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to auto-advance phases
export function useThinkingPhase() {
  const [phase, setPhase] = useState<ThinkingPhase>("searching");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("analyzing"), 1500);
    const timer2 = setTimeout(() => setPhase("generating"), 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return phase;
}
