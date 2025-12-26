"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  getChannels,
  getMyCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Channel, Collection } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CollectionsTabProps {
  isAdmin: boolean;
}

export function CollectionsTab({ isAdmin }: CollectionsTabProps) {
  const t = useTranslations("manage");
  const tch = useTranslations("channel");
  const router = useRouter();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    channelId: "",
    title: "",
    slug: "",
    summary: "",
  });
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", summary: "" });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function getChannelName(channel: Channel): string {
    try {
      return tch(`names.${channel.slug}`);
    } catch {
      return channel.name;
    }
  }

  async function fetchData() {
    setLoading(true);
    const [channelsRes, collectionsRes] = await Promise.all([
      getChannels(),
      getMyCollections(),
    ]);

    if (channelsRes.data) {
      setChannels(channelsRes.data);
      if (channelsRes.data.length > 0 && !formData.channelId) {
        setFormData((prev) => ({ ...prev, channelId: channelsRes.data![0].id }));
      }
    }
    if (collectionsRes.data) {
      setCollections(collectionsRes.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: slugify(title) });
  };

  const handleCreate = async (e: React.FormEvent) => {
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
    } else {
      // Find the channel slug and redirect to the new collection
      const channel = channels.find((ch) => ch.id === formData.channelId);
      if (channel) {
        router.push(`/c/${channel.slug}/${formData.slug}`);
      }
    }
  };

  const handleEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setEditData({ title: collection.title, summary: collection.summary || "" });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    setError(null);

    const result = await updateCollection(id, {
      title: editData.title,
      summary: editData.summary || undefined,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("collectionsTab.confirmDelete"))) return;

    setDeletingId(id);
    const result = await deleteCollection(id);
    setDeletingId(null);

    if (result.error) {
      setError(result.error);
    } else {
      fetchData();
    }
  };

  if (loading) {
    return <p className="text-[var(--color-muted-foreground)]">{t("loading")}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("collectionsTab.title")}</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {t("collectionsTab.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)]",
            "bg-[var(--color-foreground)] text-[var(--color-background)]",
            "hover:opacity-90 transition-opacity"
          )}
        >
          {showCreate ? t("buttons.cancel") : t("collectionsTab.createNew")}
        </button>
      </div>

      {/* Messages */}
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

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 border border-[var(--color-border)] rounded-[var(--radius-sm)] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t("form.channel")}</label>
              <select
                value={formData.channelId}
                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                className={cn(
                  "w-full px-3 py-2 text-sm",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]"
                )}
              >
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{getChannelName(ch)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("form.titleLabel")}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 text-sm",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]"
                )}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.slug")}</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className={cn(
                "w-full px-3 py-2 text-sm font-mono",
                "bg-[var(--color-muted)] border border-[var(--color-border)]",
                "rounded-[var(--radius-sm)]"
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.summary")}</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={2}
              className={cn(
                "w-full px-3 py-2 text-sm resize-none",
                "bg-[var(--color-muted)] border border-[var(--color-border)]",
                "rounded-[var(--radius-sm)]"
              )}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-[var(--radius-sm)]",
              "bg-[var(--color-foreground)] text-[var(--color-background)]",
              "hover:opacity-90 disabled:opacity-50"
            )}
          >
            {creating ? t("buttons.creating") : t("buttons.create")}
          </button>
        </form>
      )}

      {/* Collections List */}
      {collections.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)] text-center py-8">
          {t("collectionsTab.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className={cn(
                "p-4 border border-[var(--color-border)] rounded-[var(--radius-sm)]",
                "bg-[var(--color-card)]"
              )}
            >
              {editingId === collection.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className={cn(
                      "w-full px-3 py-2 text-sm",
                      "bg-[var(--color-muted)] border border-[var(--color-border)]",
                      "rounded-[var(--radius-sm)]"
                    )}
                  />
                  <textarea
                    value={editData.summary}
                    onChange={(e) => setEditData({ ...editData, summary: e.target.value })}
                    rows={2}
                    className={cn(
                      "w-full px-3 py-2 text-sm resize-none",
                      "bg-[var(--color-muted)] border border-[var(--color-border)]",
                      "rounded-[var(--radius-sm)]"
                    )}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(collection.id)}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-[var(--color-foreground)] text-[var(--color-background)] rounded-[var(--radius-sm)]"
                    >
                      {saving ? t("collectionsTab.saving") : t("collectionsTab.save")}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)]"
                    >
                      {t("buttons.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{collection.title}</h3>
                    {collection.summary && (
                      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                        {collection.summary}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 text-xs text-[var(--color-muted-foreground)]">
                      <span>{t("collectionsTab.documents", { count: collection.sourceCount || 0 })}</span>
                      <span>|</span>
                      <span className="font-mono">{collection.slug}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(collection)}
                      className="px-3 py-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:bg-[var(--color-muted)]"
                    >
                      {t("collectionsTab.edit")}
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      disabled={deletingId === collection.id}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-[var(--radius-sm)] hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {deletingId === collection.id ? "..." : t("collectionsTab.delete")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
