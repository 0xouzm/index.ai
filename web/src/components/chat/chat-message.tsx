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
        {/* Avatar/Icon for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3]",
              "shadow-sm"
            )}>
              <span className="text-white text-sm">✨</span>
            </div>
            <span className="text-xs font-semibold text-[var(--color-foreground)]">
              {t("message.assistant")}
            </span>
            {message.source && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                message.source === "archive"
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "bg-sky-100 text-sky-600"
              )}>
                {message.source === "archive" ? "📚 From sources" : "🌐 Web"}
              </span>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            isUser
              ? "bg-[var(--color-foreground)] text-white rounded-br-lg ml-auto"
              : "bg-white shadow-sm rounded-bl-lg"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <span className="w-2.5 h-2.5 bg-[var(--color-accent)]/40 rounded-full animate-bounce" />
              <span className="w-2.5 h-2.5 bg-[var(--color-accent)]/40 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-2.5 h-2.5 bg-[var(--color-accent)]/40 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MessageContent content={message.content} citations={message.citations} className="text-sm" />
          )}
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="flex items-center justify-end gap-2 mt-2 mr-1">
            <span className="text-[10px] text-[var(--color-muted-foreground)]">You</span>
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3] flex items-center justify-center shadow-sm">
              <span className="text-white text-xs">👤</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
