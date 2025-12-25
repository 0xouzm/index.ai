"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";
import { MessageContent } from "./message-content";

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const t = useTranslations("chat");
  const isUser = message.role === "user";
  const isLoading = message.role === "assistant" && message.content === "";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start", className)}>
      <div className={cn("max-w-[85%]", isUser ? "order-2" : "order-1")}>
        {/* Avatar/Icon */}
        {!isUser && (
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
              {t("message.assistant")}
            </span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            isUser
              ? "bg-[var(--color-foreground)] text-[var(--color-background)] rounded-br-md"
              : "bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm rounded-bl-md"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 bg-[var(--color-muted-foreground)]/50 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MessageContent content={message.content} citations={message.citations} className="text-sm" />
          )}
        </div>

        {/* Source Badge */}
        {!isUser && message.source && (
          <div className="flex items-center gap-2 mt-2 ml-1">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              message.source === "archive"
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}>
              {message.source === "archive" ? (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                  </svg>
                  {t("message.archive")}
                </>
              ) : (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  {t("message.web")}
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
