"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getChannel, getCollection, getDocuments } from "@/lib/mock-data";
import { sendChatQuery } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Document, ChatMessage } from "@/types";

interface CollectionPageProps {
  params: Promise<{ slug: string; collection: string }>;
}

// Mock chat messages
const initialMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content:
      "Welcome to this collection. I can help you explore and understand the documents. Ask me anything about the content!",
    source: "archive",
    createdAt: new Date().toISOString(),
  },
];

export default function CollectionPage({ params }: CollectionPageProps) {
  const { slug, collection: collectionSlug } = use(params);
  const channel = getChannel(slug);
  const collection = getCollection(slug, collectionSlug);

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!channel || !collection) {
    notFound();
  }

  const documents = getDocuments(collection.id);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Call the API
      const response = await sendChatQuery({
        collectionId: collection.id,
        question,
        documentIds: selectedDoc ? [selectedDoc.id] : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data!;
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        source: data.source,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Fallback to mock response if API fails
      console.error("API error, using fallback:", error);
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `[Offline Mode] I found relevant information about "${question}" in this collection. The DeepSeek-V3 model uses a Mixture-of-Experts architecture with 671B total parameters.`,
        citations: documents.length > 0 ? [
          {
            documentId: documents[0].id,
            documentTitle: documents[0].title,
            chunkContent: "Sample content from the document...",
            page: 1,
          },
        ] : [],
        source: "archive",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--color-border)] flex-shrink-0">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3">
          <nav className="text-sm text-[var(--color-muted-foreground)]">
            <Link href="/" className="hover:text-[var(--color-foreground)]">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/c/${slug}`}
              className="hover:text-[var(--color-foreground)]"
            >
              {channel.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-[var(--color-foreground)]">
              {collection.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Collection Header */}
      <div className="border-b border-[var(--color-border)] py-4 flex-shrink-0">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
          <h1 className="font-display text-2xl font-bold">{collection.title}</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
            {collection.sourceCount} sources &middot; By {collection.by}
          </p>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="mx-auto max-w-[1600px] w-full flex">
          {/* Left Column - Document List (20%) */}
          <aside
            className={cn(
              "w-[280px] flex-shrink-0",
              "border-r border-[var(--color-border)]",
              "overflow-y-auto"
            )}
          >
            <div className="p-4">
              <h2 className="font-medium text-sm text-[var(--color-muted-foreground)] mb-3">
                Documents ({documents.length})
              </h2>
              <ul className="space-y-1">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-[var(--radius-sm)]",
                        "text-sm transition-colors",
                        selectedDoc?.id === doc.id
                          ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                      )}
                    >
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs mt-0.5 opacity-70">
                        {doc.sourceType.toUpperCase()} &middot;{" "}
                        {doc.chunkCount} chunks
                      </div>
                    </button>
                  </li>
                ))}
                {documents.length === 0 && (
                  <li className="text-sm text-[var(--color-muted-foreground)] px-3 py-2">
                    No documents yet
                  </li>
                )}
              </ul>
            </div>
          </aside>

          {/* Center Column - AI Chat (50%) */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[80%]",
                    message.role === "user" ? "ml-auto" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 rounded-[var(--radius-md)]",
                      message.role === "user"
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                        : "bg-[var(--color-muted)]"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                        <p className="text-xs font-medium mb-2 opacity-70">
                          Sources:
                        </p>
                        {message.citations.map((citation, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-[var(--color-background)] p-2 rounded mb-1"
                          >
                            <span className="font-medium">
                              {citation.documentTitle}
                            </span>
                            {citation.page && (
                              <span className="opacity-70">
                                {" "}
                                &middot; Page {citation.page}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.source && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1 px-1">
                      Source: {message.source === "archive" ? "Archive" : "Web"}
                    </p>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="max-w-[80%] mr-auto">
                  <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-muted)]">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-[var(--color-muted-foreground)] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[var(--color-border)] p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask about the documents..."
                  className={cn(
                    "flex-1 px-4 py-2",
                    "bg-[var(--color-muted)] border border-[var(--color-border)]",
                    "rounded-[var(--radius-sm)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  )}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className={cn(
                    "px-4 py-2",
                    "bg-[var(--color-foreground)] text-[var(--color-background)]",
                    "font-medium rounded-[var(--radius-sm)]",
                    "hover:opacity-90 transition-opacity",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Send
                </button>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                AI responses are grounded in the collection&apos;s documents
              </p>
            </div>
          </main>

          {/* Right Column - Summary (30%) */}
          <aside
            className={cn(
              "w-[320px] flex-shrink-0",
              "border-l border-[var(--color-border)]",
              "overflow-y-auto hidden lg:block"
            )}
          >
            <div className="p-4">
              <h2 className="font-medium text-sm text-[var(--color-muted-foreground)] mb-3">
                Summary
              </h2>
              {collection.summary ? (
                <p className="text-sm leading-relaxed">{collection.summary}</p>
              ) : (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  No summary available
                </p>
              )}

              <h2 className="font-medium text-sm text-[var(--color-muted-foreground)] mb-3 mt-6">
                Key Concepts
              </h2>
              <div className="flex flex-wrap gap-2">
                {["MoE Architecture", "Transformer", "Training", "Inference"].map(
                  (concept) => (
                    <span
                      key={concept}
                      className={cn(
                        "px-2 py-1 text-xs",
                        "bg-[var(--color-muted)]",
                        "rounded-[var(--radius-sm)]"
                      )}
                    >
                      {concept}
                    </span>
                  )
                )}
              </div>

              {selectedDoc && (
                <>
                  <h2 className="font-medium text-sm text-[var(--color-muted-foreground)] mb-3 mt-6">
                    Selected Document
                  </h2>
                  <div className="p-3 bg-[var(--color-muted)] rounded-[var(--radius-md)]">
                    <h3 className="font-medium text-sm">{selectedDoc.title}</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                      {selectedDoc.sourceType.toUpperCase()} &middot;{" "}
                      {selectedDoc.chunkCount} chunks &middot;{" "}
                      {selectedDoc.tokenCount.toLocaleString()} tokens
                    </p>
                    {selectedDoc.summary && (
                      <p className="text-sm mt-2">{selectedDoc.summary}</p>
                    )}
                    {selectedDoc.sourceUrl && (
                      <a
                        href={selectedDoc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-accent)] hover:underline mt-2 inline-block"
                      >
                        View Original &rarr;
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
