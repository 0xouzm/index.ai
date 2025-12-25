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

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [channelsData, setChannelsData] = useState<ChannelWithCollections[]>(
    []
  );
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

  const featuredCollection = allCollections[0];
  const recentCollections = allCollections.slice(1, 7);
  const moreCollections = allCollections.slice(7, 13);

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[var(--color-muted-foreground)]">
            {tc("loading")}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      {/* Ticker / Tagline */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="py-2 text-xs text-[var(--color-muted-foreground)] text-center tracking-wide uppercase">
            {t("hero.tagline")}
          </p>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {channelsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--color-muted-foreground)]">
                {t("empty.noChannels")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Main Content Area */}
              <div className="col-span-12 lg:col-span-8">
                {/* Featured + Recent Grid */}
                <div className="grid grid-cols-12 gap-4 mb-6">
                  {featuredCollection && (
                    <Link
                      href={`/c/${featuredCollection.channelSlug}/${featuredCollection.slug}`}
                      className="col-span-12 md:col-span-7 group"
                    >
                      <article className="h-full border border-[var(--color-border)] bg-[var(--color-card)] p-5 hover:border-[var(--color-foreground)] transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                            Featured
                          </span>
                          <span className="text-[10px] text-[var(--color-muted-foreground)]">
                            {featuredCollection.channelName}
                          </span>
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight mb-3 group-hover:text-[var(--color-accent)] transition-colors">
                          {featuredCollection.title}
                        </h2>
                        {featuredCollection.summary && (
                          <p className="text-sm text-[var(--color-muted-foreground)] line-clamp-3 mb-4">
                            {featuredCollection.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                          <span>
                            {t("collection.sources", {
                              count: featuredCollection.sourceCount,
                            })}
                          </span>
                          <span>·</span>
                          <span>
                            {t("collection.by")} {featuredCollection.by}
                          </span>
                          {featuredCollection.createdAt && (
                            <>
                              <span>·</span>
                              <span>
                                {formatDate(featuredCollection.createdAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </article>
                    </Link>
                  )}

                  <div className="col-span-12 md:col-span-5 space-y-3">
                    {recentCollections.slice(0, 4).map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/c/${collection.channelSlug}/${collection.slug}`}
                        className="group block border-b border-[var(--color-border)] pb-3 last:border-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                            {collection.channelName}
                          </span>
                        </div>
                        <h3 className="font-medium text-sm leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                          {collection.title}
                        </h3>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                          {t("collection.sources", {
                            count: collection.sourceCount,
                          })}{" "}
                          · {collection.by}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Channel Sections */}
                <div className="border-t-2 border-[var(--color-foreground)] pt-4">
                  <h2 className="font-display text-lg font-bold mb-4">
                    {t("sections.browseByChannel")}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {channelsData.map(({ channel, collections }) => (
                      <div key={channel.id} className="space-y-2">
                        <Link
                          href={`/c/${channel.slug}`}
                          className="group flex items-center gap-1"
                        >
                          <h3 className="font-semibold text-sm group-hover:text-[var(--color-accent)] transition-colors">
                            {channel.name}
                          </h3>
                          <span className="text-xs text-[var(--color-muted-foreground)]">
                            →
                          </span>
                        </Link>
                        <ul className="space-y-1.5">
                          {collections.slice(0, 3).map((collection) => (
                            <li key={collection.id}>
                              <Link
                                href={`/c/${channel.slug}/${collection.slug}`}
                                className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors line-clamp-1"
                              >
                                {collection.title}
                              </Link>
                            </li>
                          ))}
                          {collections.length === 0 && (
                            <li className="text-xs text-[var(--color-muted-foreground)] italic">
                              {t("empty.noCollections")}
                            </li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <aside className="col-span-12 lg:col-span-4 space-y-6">
                <div className="border border-[var(--color-border)] bg-[var(--color-card)]">
                  <div className="px-4 py-3 border-b border-[var(--color-border)]">
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                      {t("sections.latestCollections")}
                    </h3>
                  </div>
                  <ul className="divide-y divide-[var(--color-border)]">
                    {recentCollections.slice(0, 6).map((collection, idx) => (
                      <li key={collection.id}>
                        <Link
                          href={`/c/${collection.channelSlug}/${collection.slug}`}
                          className="group flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-muted)] transition-colors"
                        >
                          <span className="font-display text-2xl font-bold text-[var(--color-muted-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium leading-snug group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                              {collection.title}
                            </h4>
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                              {collection.channelName}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-3">
                    {t("sections.quickActions")}
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/manage"
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm",
                        "border border-[var(--color-border)]",
                        "hover:bg-[var(--color-muted)] transition-colors"
                      )}
                    >
                      <span>{t("cta.createCollection")}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        +
                      </span>
                    </Link>
                    <Link
                      href="/auth"
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm",
                        "border border-[var(--color-border)]",
                        "hover:bg-[var(--color-muted)] transition-colors"
                      )}
                    >
                      <span>{t("cta.signInRegister")}</span>
                      <span className="text-[var(--color-muted-foreground)]">
                        →
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
                    <div className="font-display text-2xl font-bold">
                      {channelsData.length}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">
                      {tc("stats.channels")}
                    </div>
                  </div>
                  <div className="border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-center">
                    <div className="font-display text-2xl font-bold">
                      {allCollections.length}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider">
                      {tc("stats.collections")}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {moreCollections.length > 0 && (
            <section className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <h2 className="font-display text-lg font-bold mb-4">
                {t("sections.moreToExplore")}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {moreCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/c/${collection.channelSlug}/${collection.slug}`}
                    className="group"
                  >
                    <article className="border border-[var(--color-border)] p-3 hover:border-[var(--color-foreground)] transition-colors h-full">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        {collection.channelName}
                      </span>
                      <h3 className="font-medium text-sm mt-1 group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                        {collection.title}
                      </h3>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                        {t("collection.sources", {
                          count: collection.sourceCount,
                        })}
                      </p>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--color-border)] py-4 bg-[var(--color-muted)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-4">
              <span className="font-display font-bold text-[var(--color-foreground)]">
                Index.ai
              </span>
              <span>© 2024</span>
            </div>
            <nav className="flex items-center gap-4">
              {channelsData.map(({ channel }) => (
                <Link
                  key={channel.id}
                  href={`/c/${channel.slug}`}
                  className="hover:text-[var(--color-foreground)] transition-colors"
                >
                  {channel.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
