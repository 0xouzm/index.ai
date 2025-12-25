"use client";

import { useState, useCallback } from "react";
import { sendChatQuery } from "@/lib/api";
import type { ChatMessage } from "@/types";

interface UseChatOptions {
  collectionId: string;
  selectedDocIds: Set<string>;
}

interface UseChatReturn {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
}

export function useChat({ collectionId, selectedDocIds }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await sendChatQuery({
        collectionId,
        question: content,
        documentIds: selectedDocIds.size > 0 ? Array.from(selectedDocIds) : undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: result.data!.answer,
          source: result.data!.source,
          citations: result.data!.citations,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Failed"}`,
          source: "archive",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [collectionId, selectedDocIds, isLoading]);

  return { messages, setMessages, isLoading, sendMessage };
}
