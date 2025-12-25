"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import type { Channel, Collection } from "@/types";

export const runtime = "edge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ChannelWithCollections {
  channel: Channel;
  collections: Collection[];
}

const channelEmojis: Record<string, string> = {
  "programming-ai": "💻",
  travel: "✈️",
  fitness: "💪",
  nutrition: "🥗",
};

const channelColors: Record<string, string> = {
  "programming-ai": "from-blue-400 to-indigo-500",
  travel: "from-cyan-400 to-blue-500",
  fitness: "from-teal-400 to-cyan-500",
  nutrition: "from-emerald-400 to-teal-500",
};

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [channelsData, setChannelsData] = useState<ChannelWithCollections[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const channelsRes = await fetch(`${API_BASE}/api/v1/channels`);
        if (!channelsRes.ok) {
          setLoading(false);
          return;
        }
        const channelsJson = await channelsRes.json();
        const channels: Channel[] = channelsJson.channels || [];

        const results = await Promise.all(
          channels.map(async (channel) => {
            const collectionsRes = await fetch(
              `${API_BASE}/api/v1/collections?channelSlug=${channel.slug}`
            );
            const collectionsJson = collectionsRes.ok
              ? await collectionsRes.json()
              : { collections: [] };
            return {
              channel,
              collections: collectionsJson.collections || [],
            };
          })
        );

        setChannelsData(results);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const allCollections = channelsData
    .flatMap(({ channel, collections }) =>
      collections.map((c) => ({
        ...c,
        channelSlug: channel.slug,
        channelName: channel.name,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-3 border-[var(--color-accent)] border-t-transparent animate-spin" />
            <p className="text-sm text-[var(--color-muted-foreground)]">{tc("loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-soft)] via-transparent to-[#E6FFFA] opacity-60" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-foreground)] leading-tight">
                {t("hero.title")}
              </h1>
              <p className="mt-6 text-lg text-[var(--color-muted-foreground)] leading-relaxed">
                {t("hero.tagline")}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {channelsData.map(({ channel }) => (
                  <Link
                    key={channel.id}
                    href={`/c/${channel.slug}`}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2.5 rounded-full",
                      "bg-white shadow-sm hover:shadow-md",
                      "text-sm font-medium text-[var(--color-foreground)]",
                      "transition-all duration-200 hover:-translate-y-0.5"
                    )}
                  >
                    <span>{channelEmojis[channel.slug] || "📚"}</span>
                    {channel.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Collections */}
        {allCollections.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-[var(--color-foreground)]">
                {t("sections.latestCollections")}
              </h2>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {allCollections.length} {tc("stats.collections").toLowerCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCollections.slice(0, 6).map((collection, idx) => (
                <Link
                  key={collection.id}
                  href={`/c/${collection.channelSlug}/${collection.slug}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-white p-6",
                    "shadow-sm hover:shadow-lg",
                    "transition-all duration-300 hover:-translate-y-1"
                  )}
                >
                  {/* Decorative gradient */}
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl",
                      "bg-gradient-to-br",
                      channelColors[collection.channelSlug] || "from-gray-400 to-gray-500"
                    )}
                  />

                  <div className="relative">
                    {/* Channel badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-lg bg-[var(--color-muted)] flex items-center justify-center text-base">
                        {channelEmojis[collection.channelSlug] || "📚"}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                        {collection.channelName}
                      </span>
                      {idx === 0 && (
                        <span className="ml-auto px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                          New
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-lg font-semibold text-[var(--color-foreground)] leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                      {collection.title}
                    </h3>

                    {/* Summary */}
                    {collection.summary && (
                      <p className="mt-3 text-sm text-[var(--color-muted-foreground)] leading-relaxed line-clamp-2">
                        {collection.summary}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {collection.sourceCount} sources
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[var(--color-border-hover)]" />
                      <span>{collection.by}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Browse by Channel */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display text-2xl font-bold text-[var(--color-foreground)] mb-8">
            {t("sections.browseByChannel")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {channelsData.map(({ channel, collections }) => (
              <div
                key={channel.id}
                className="rounded-2xl bg-[var(--color-muted)] p-6 hover:bg-[var(--color-border)] transition-colors"
              >
                <Link
                  href={`/c/${channel.slug}`}
                  className="flex items-center gap-3 mb-4 group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br shadow-sm",
                      channelColors[channel.slug] || "from-gray-400 to-gray-500"
                    )}
                  >
                    <span className="filter drop-shadow-sm">
                      {channelEmojis[channel.slug] || "📚"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
                      {channel.name}
                    </h3>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {collections.length} {tc("stats.collections").toLowerCase()}
                    </p>
                  </div>
                </Link>

                <ul className="space-y-2">
                  {collections.slice(0, 3).map((collection) => (
                    <li key={collection.id}>
                      <Link
                        href={`/c/${channel.slug}/${collection.slug}`}
                        className="block px-3 py-2 rounded-lg text-sm text-[var(--color-muted-foreground)] hover:bg-white hover:text-[var(--color-foreground)] hover:shadow-sm transition-all line-clamp-1"
                      >
                        {collection.title}
                      </Link>
                    </li>
                  ))}
                  {collections.length === 0 && (
                    <li className="px-3 py-2 text-sm text-[var(--color-muted-foreground)] italic">
                      {t("empty.noCollections")}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-gradient-to-br from-[#1A365D] to-[#2B4C7E] p-8 md:p-12 text-white">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                {t("cta.title", { defaultValue: "Create Your Knowledge Base" })}
              </h2>
              <p className="text-white/70 mb-6">
                {t("cta.description", { defaultValue: "Curate sources, ask questions, and get AI-powered insights from your collection." })}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/manage"
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-full",
                    "bg-white text-[var(--color-foreground)]",
                    "font-semibold text-sm",
                    "hover:bg-white/90 hover:shadow-lg",
                    "transition-all duration-200"
                  )}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t("cta.createCollection")}
                </Link>
                <Link
                  href="/auth"
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-full",
                    "bg-white/10 text-white border border-white/20",
                    "font-semibold text-sm",
                    "hover:bg-white/20",
                    "transition-all duration-200"
                  )}
                >
                  {t("cta.signInRegister")}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 bg-[var(--color-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3] flex items-center justify-center shadow-sm">
                <span className="text-white font-display font-bold text-sm">i</span>
              </div>
              <span className="font-display font-bold text-[var(--color-foreground)]">
                Index.ai
              </span>
              <span className="text-sm text-[var(--color-muted-foreground)]">© 2024</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {channelsData.map(({ channel }) => (
                <Link
                  key={channel.id}
                  href={`/c/${channel.slug}`}
                  className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  {channelEmojis[channel.slug]} {channel.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
