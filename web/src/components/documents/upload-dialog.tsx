"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createDocument, uploadPdfDocument, type CreateDocumentRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface UploadDialogProps {
  collectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ProcessingStep = "idle" | "uploading" | "fetching" | "extracting" | "analyzing" | "embedding" | "done";
type UploadMode = "text" | "url" | "pdf";

const STEP_DURATION_MS = 8000; // Estimated time per step

export function UploadDialog({ collectionId, isOpen, onClose, onSuccess }: UploadDialogProps) {
  const t = useTranslations("chat");
  const [mode, setMode] = useState<UploadMode>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate step progression for visual feedback
  useEffect(() => {
    if (!loading) {
      setProcessingStep("idle");
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    if (mode === "pdf") {
      // PDF mode: uploading -> extracting -> analyzing -> embedding
      setProcessingStep("uploading");
      timers.push(setTimeout(() => setProcessingStep("extracting"), STEP_DURATION_MS * 0.5));
      timers.push(setTimeout(() => setProcessingStep("analyzing"), STEP_DURATION_MS * 1.5));
      timers.push(setTimeout(() => setProcessingStep("embedding"), STEP_DURATION_MS * 2.5));
    } else if (mode === "url") {
      // URL mode: fetching -> analyzing -> embedding
      setProcessingStep("fetching");
      timers.push(setTimeout(() => setProcessingStep("analyzing"), STEP_DURATION_MS));
      timers.push(setTimeout(() => setProcessingStep("embedding"), STEP_DURATION_MS * 2));
    } else {
      // Text mode: analyzing -> embedding
      setProcessingStep("analyzing");
      timers.push(setTimeout(() => setProcessingStep("embedding"), STEP_DURATION_MS));
    }

    return () => timers.forEach(clearTimeout);
  }, [loading, mode]);

  const handleSubmit = async () => {
    setError(null);

    // PDF mode doesn't require title (uses filename)
    if (mode !== "pdf" && !title.trim()) {
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

    if (mode === "pdf" && !pdfFile) {
      setError(t("upload.errors.fileRequired"));
      return;
    }

    setLoading(true);

    let result;
    if (mode === "pdf" && pdfFile) {
      result = await uploadPdfDocument(collectionId, title.trim() || pdfFile.name.replace(/\.pdf$/i, ""), pdfFile);
    } else {
      const request: CreateDocumentRequest = {
        collectionId,
        title: title.trim(),
        sourceType: mode === "text" ? "markdown" : "url",
        ...(mode === "text" ? { content: content.trim() } : { sourceUrl: url.trim() }),
      };
      result = await createDocument(request);
    }

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
        setPdfFile(null);
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
                {(["text", "url", "pdf"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "px-4 py-2 text-sm rounded-[var(--radius-sm)] transition-colors",
                      mode === m
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                        : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                    )}
                  >
                    {t(`upload.tabs.${m}`)}
                  </button>
                ))}
              </div>

              {/* Title (optional for PDF) */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {t("upload.titleLabel")}
                  {mode === "pdf" && <span className="text-[var(--color-muted-foreground)] ml-1">({t("upload.optional")})</span>}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={mode === "pdf" ? t("upload.titlePlaceholderPdf") : t("upload.titlePlaceholder")}
                  className={cn(
                    "w-full px-4 py-2",
                    "bg-[var(--color-muted)] border border-[var(--color-border)]",
                    "rounded-[var(--radius-sm)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  )}
                />
              </div>

              {/* Content / URL / PDF */}
              {mode === "text" && (
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
              )}
              {mode === "url" && (
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
              {mode === "pdf" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">{t("upload.file")}</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "border-2 border-dashed rounded-[var(--radius-sm)] p-6 text-center cursor-pointer transition-colors",
                      "hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/5",
                      pdfFile ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5" : "border-[var(--color-border)]"
                    )}
                  >
                    {pdfFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">📄</span>
                        <span className="font-medium">{pdfFile.name}</span>
                        <span className="text-sm text-[var(--color-muted-foreground)]">
                          ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl block mb-2">📤</span>
                        <p className="text-sm text-[var(--color-muted-foreground)]">{t("upload.filePlaceholder")}</p>
                      </div>
                    )}
                  </div>
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
function ProcessingStatus({ step, mode }: { step: ProcessingStep; mode: UploadMode }) {
  const t = useTranslations("chat");

  const steps = mode === "pdf"
    ? [
        { id: "uploading", label: t("upload.steps.uploading"), icon: "📤" },
        { id: "extracting", label: t("upload.steps.extracting"), icon: "📄" },
        { id: "analyzing", label: t("upload.steps.analyzing"), icon: "🔍" },
        { id: "embedding", label: t("upload.steps.embedding"), icon: "🧠" },
      ]
    : mode === "url"
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
