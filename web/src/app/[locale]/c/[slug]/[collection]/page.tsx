"use client";

import { use, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { SourceSelector, SourceGuide, ChatMessage, StudioPanel, LoadingIndicator } from "@/components/chat";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { getCollection } from "@/lib/api";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { Document, Collection } from "@/types";

export const runtime = "edge";

interface CollectionPageProps {
  params: Promise<{ slug: string; collection: string; locale: string }>;
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const { slug, collection: collectionSlug } = use(params);
  const t = useTranslations("chat");
  const tc = useTranslations("common");

  const [collection, setCollection] = useState<(Collection & { documents: Document[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showMobileSources, setShowMobileSources] = useState(false);
  const [showStudio, setShowStudio] = useState(true);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const { messages, setMessages, isLoading, sendMessage } = useChat({
    collectionId: collection?.id || "",
    selectedDocIds,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getCollection(slug, collectionSlug);
    if (result.error || !result.data) {
      setError(result.error || "Collection not found");
    } else {
      setCollection(result.data);
      setSelectedDocIds(new Set(result.data.documents.map((d) => d.id)));
      if (messages.length === 0) {
        setMessages([{
          id: "msg-welcome",
          role: "assistant",
          content: t("welcome.greeting", { title: result.data.title }),
          source: "archive",
          createdAt: new Date().toISOString(),
        }]);
      }
    }
    setLoading(false);
  }, [slug, collectionSlug, messages.length, t, setMessages]);

  useEffect(() => {
    fetchData();
  }, [slug, collectionSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleDoc = useCallback((id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (!collection) return;
    const allIds = collection.documents.map((d) => d.id);
    setSelectedDocIds((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));
  }, [collection]);

  const handleDocumentUpdate = useCallback((updatedDoc: Document) => {
    setCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === updatedDoc.id ? updatedDoc : d
        ),
      };
    });
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !collection) return;
    const question = inputValue;
    setInputValue("");
    await sendMessage(question);
  };

  // Sidebar resize handlers
  const MIN_SIDEBAR_WIDTH = 280;
  const MAX_SIDEBAR_WIDTH = 600;
  const EXPANDED_SIDEBAR_WIDTH = 400;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // Auto-expand sidebar when viewing document
  useEffect(() => {
    if (viewingDocument) {
      setSidebarWidth((prev) => Math.max(prev, EXPANDED_SIDEBAR_WIDTH));
    }
  }, [viewingDocument]);

  const lastUpdated = useMemo(() => {
    if (!collection) return null;
    return new Date(collection.updatedAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  }, [collection]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-muted-foreground)]">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    notFound();
  }

  const documents = collection.documents || [];

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)] overflow-hidden">
      <Header />
      <UploadDialog collectionId={collection.id} isOpen={showUpload} onClose={() => setShowUpload(false)} onSuccess={() => fetchData()} />

      {/* Mobile header */}
      <div className="lg:hidden border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setShowMobileSources(true)} className="flex items-center gap-2 text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="font-medium">{selectedDocIds.size} {t("sources.title")}</span>
        </button>
        <h1 className="font-display font-semibold truncate max-w-[200px]">{collection.title}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sources Sidebar */}
        <aside
          ref={sidebarRef}
          style={{ width: showMobileSources ? "100%" : sidebarWidth }}
          className={cn(
            "flex-shrink-0 border-r border-[var(--color-border)] hidden lg:flex flex-col overflow-hidden relative",
            showMobileSources && "!flex fixed inset-0 z-50 bg-[var(--color-background)]"
          )}
        >
          {showMobileSources && (
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <h2 className="font-display font-semibold">{t("sources.title")}</h2>
              <button onClick={() => { setShowMobileSources(false); setViewingDocument(null); }} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--color-muted)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {viewingDocument ? (
            <SourceGuide document={viewingDocument} onBack={() => setViewingDocument(null)} onDocumentUpdate={handleDocumentUpdate} />
          ) : (
            <SourceSelector documents={documents} selectedIds={selectedDocIds} onToggle={handleToggleDoc} onToggleAll={handleToggleAll} onAddClick={() => { setShowUpload(true); setShowMobileSources(false); }} onDocumentClick={(doc) => setViewingDocument(doc)} />
          )}
          {/* Resize Handle */}
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize",
              "hover:bg-[var(--color-accent)]/30 transition-colors",
              "hidden lg:block",
              isResizing && "bg-[var(--color-accent)]/50"
            )}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header */}
          <div className="hidden lg:block border-b border-[var(--color-border)] px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] mb-1">
                  <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">{tc("nav.home")}</Link>
                  <span>/</span>
                  <Link href={`/c/${slug}`} className="hover:text-[var(--color-foreground)] transition-colors">{slug}</Link>
                  <span>/</span>
                  <span className="text-[var(--color-foreground)]">{collection.title}</span>
                </nav>
                <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">{t("title")}</h1>
              </div>
              {lastUpdated && <p className="text-xs text-[var(--color-muted-foreground)]">{t("info.lastUpdated")} {lastUpdated}</p>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
              {isLoading && <LoadingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className={cn("flex items-end gap-3 p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm focus-within:shadow-md focus-within:border-[var(--color-accent)]/30 transition-all")}>
                <input ref={inputRef} type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()} placeholder={t("input.placeholder")} disabled={isLoading} className={cn("flex-1 bg-transparent px-2 py-1.5 text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none disabled:opacity-50")} />
                <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={cn("flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed")} aria-label="Send">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-2">
                <p className="text-xs text-[var(--color-muted-foreground)]">{t("sources.selected", { count: selectedDocIds.size })}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{t("info.grounded")}</p>
              </div>
            </div>
          </div>
        </main>

        {/* Studio Panel */}
        <aside className={cn("flex-shrink-0 border-l border-[var(--color-border)] hidden xl:block", showStudio ? "w-[300px]" : "w-[48px]")}>
          {showStudio ? (
            <StudioPanel collection={collection} selectedDocIds={selectedDocIds} isCollapsed={!showStudio} onToggle={() => setShowStudio((prev) => !prev)} />
          ) : (
            <div className="h-full flex flex-col items-center py-4">
              <button onClick={() => setShowStudio(true)} className={cn("w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--color-muted)] transition-colors")} aria-label="Expand Studio">
                <svg className="w-5 h-5 text-[var(--color-muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              </button>
              <span className="mt-3 text-[10px] font-medium text-[var(--color-muted-foreground)]" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("studio.title")}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
