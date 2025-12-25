"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createDocument, type CreateDocumentRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadDialogProps {
  collectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadDialog({ collectionId, isOpen, onClose, onSuccess }: UploadDialogProps) {
  const t = useTranslations("chat");
  const [mode, setMode] = useState<"text" | "url">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError(t("upload.errors.titleRequired"));
      return;
    }

    if (mode === "text" && !content.trim()) {
      setError(t("upload.errors.contentRequired"));
      return;
    }

    if (mode === "url" && !url.trim()) {
      setError(t("upload.errors.urlRequired"));
      return;
    }

    setLoading(true);

    const request: CreateDocumentRequest = {
      collectionId,
      title: title.trim(),
      sourceType: mode === "text" ? "markdown" : "url",
      ...(mode === "text" ? { content: content.trim() } : { sourceUrl: url.trim() }),
    };

    const result = await createDocument(request);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setTitle("");
      setContent("");
      setUrl("");
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="font-display text-xl font-bold mb-4">{t("upload.title")}</h2>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("text")}
              className={cn(
                "px-4 py-2 text-sm rounded-[var(--radius-sm)] transition-colors",
                mode === "text"
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {t("upload.tabs.text")}
            </button>
            <button
              onClick={() => setMode("url")}
              className={cn(
                "px-4 py-2 text-sm rounded-[var(--radius-sm)] transition-colors",
                mode === "url"
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {t("upload.tabs.url")}
            </button>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t("upload.titleLabel")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("upload.titlePlaceholder")}
              className={cn(
                "w-full px-4 py-2",
                "bg-[var(--color-muted)] border border-[var(--color-border)]",
                "rounded-[var(--radius-sm)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              )}
            />
          </div>

          {/* Content or URL */}
          {mode === "text" ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("upload.content")}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("upload.contentPlaceholder")}
                rows={10}
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                  "resize-none font-mono text-sm"
                )}
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t("upload.url")}</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("upload.urlPlaceholder")}
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            >
              {t("upload.buttons.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm",
                "bg-[var(--color-foreground)] text-[var(--color-background)]",
                "rounded-[var(--radius-sm)]",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? t("upload.buttons.adding") : t("upload.buttons.add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
