"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { getChannels, createCollection } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types";

export const runtime = "edge";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ManagePage() {
  const t = useTranslations("manage");
  const tc = useTranslations("common");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    channelId: "",
    title: "",
    slug: "",
    summary: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChannels() {
      const result = await getChannels();
      if (result.data) {
        setChannels(result.data);
        if (result.data.length > 0) {
          setFormData((prev) => ({ ...prev, channelId: result.data![0].id }));
        }
      }
      setLoading(false);
    }
    fetchChannels();
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: slugify(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.channelId || !formData.title || !formData.slug) {
      setError(t("errors.requiredFields"));
      return;
    }

    setCreating(true);

    const result = await createCollection({
      channelId: formData.channelId,
      title: formData.title,
      slug: formData.slug,
      summary: formData.summary || undefined,
    });

    setCreating(false);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setSuccess(`Collection "${formData.title}" created successfully!`);
      setFormData({
        channelId: channels[0]?.id || "",
        title: "",
        slug: "",
        summary: "",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-muted-foreground)]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
            <p className="text-[var(--color-muted-foreground)] mt-2">
              {t("subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("form.channel")}
              </label>
              <select
                value={formData.channelId}
                onChange={(e) =>
                  setFormData({ ...formData, channelId: e.target.value })
                }
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              >
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("form.titleLabel")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t("form.titlePlaceholder")}
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("form.slug")}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder={t("form.slugPlaceholder")}
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                  "font-mono text-sm"
                )}
              />
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                URL: /c/channel/{formData.slug || "slug"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("form.summary")}
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder={t("form.summaryPlaceholder")}
                rows={3}
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]",
                  "resize-none"
                )}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-[var(--radius-sm)] text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-[var(--radius-sm)] text-sm">
                {success}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creating}
                className={cn(
                  "px-6 py-2",
                  "bg-[var(--color-foreground)] text-[var(--color-background)]",
                  "font-medium rounded-[var(--radius-sm)]",
                  "hover:opacity-90 transition-opacity",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {creating ? t("buttons.creating") : t("buttons.create")}
              </button>
              <Link
                href="/"
                className={cn(
                  "px-6 py-2",
                  "border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "hover:bg-[var(--color-muted)] transition-colors"
                )}
              >
                {t("buttons.cancel")}
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
