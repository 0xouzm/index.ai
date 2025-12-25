"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createDocument, type CreateDocumentRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadDialogProps {
  collectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ProcessingStep = "idle" | "fetching" | "analyzing" | "embedding" | "done";

const STEP_DURATION_MS = 8000; // Estimated time per step

export function UploadDialog({ collectionId, isOpen, onClose, onSuccess }: UploadDialogProps) {
  const t = useTranslations("chat");
  const [mode, setMode] = useState<"text" | "url">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");

  // Simulate step progression for visual feedback
  useEffect(() => {
    if (!loading) {
      setProcessingStep("idle");
      return;
    }

    // Start with fetching (for URL) or analyzing (for text)
    setProcessingStep(mode === "url" ? "fetching" : "analyzing");

    const timers: NodeJS.Timeout[] = [];

    if (mode === "url") {
      // URL mode: fetching -> analyzing -> embedding
      timers.push(setTimeout(() => setProcessingStep("analyzing"), STEP_DURATION_MS));
      timers.push(setTimeout(() => setProcessingStep("embedding"), STEP_DURATION_MS * 2));
    } else {
      // Text mode: analyzing -> embedding
      timers.push(setTimeout(() => setProcessingStep("embedding"), STEP_DURATION_MS));
    }

    return () => timers.forEach(clearTimeout);
  }, [loading, mode]);

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
    setProcessingStep("idle");

    if (result.error) {
      setError(result.error);
    } else {
      setProcessingStep("done");
      setTimeout(() => {
        setTitle("");
        setContent("");
        setUrl("");
        onSuccess();
        onClose();
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} />
      <div className="relative bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="font-display text-xl font-bold mb-4">{t("upload.title")}</h2>

          {/* Processing Status */}
          {loading && (
            <ProcessingStatus step={processingStep} mode={mode} />
          )}

          {!loading && (
            <>
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
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm text-[var(--color-muted-foreground)]",
                loading ? "opacity-50 cursor-not-allowed" : "hover:text-[var(--color-foreground)]"
              )}
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

// Processing status component with animated steps
function ProcessingStatus({ step, mode }: { step: ProcessingStep; mode: "text" | "url" }) {
  const t = useTranslations("chat");

  const steps = mode === "url"
    ? [
        { id: "fetching", label: t("upload.steps.fetching"), icon: "🌐" },
        { id: "analyzing", label: t("upload.steps.analyzing"), icon: "🔍" },
        { id: "embedding", label: t("upload.steps.embedding"), icon: "🧠" },
      ]
    : [
        { id: "analyzing", label: t("upload.steps.analyzing"), icon: "🔍" },
        { id: "embedding", label: t("upload.steps.embedding"), icon: "🧠" },
      ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="mb-6 py-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[var(--color-muted)] flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((s, index) => {
          const isActive = s.id === step;
          const isCompleted = index < currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300",
                isActive && "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20",
                isCompleted && "opacity-60",
                isPending && "opacity-40"
              )}
            >
              <span className="text-lg">{s.icon}</span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  isActive && "font-medium text-[var(--color-accent)]"
                )}
              >
                {s.label}
              </span>
              {isCompleted && (
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {isActive && (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
              )}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-[var(--color-muted-foreground)] mt-4">
        {t("upload.steps.hint")}
      </p>
    </div>
  );
}
