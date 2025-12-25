import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import type { Channel, Collection } from "@/types";

export const runtime = "edge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ChannelPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getChannel(slug: string): Promise<Channel | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/channels/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.channel || null;
  } catch {
    return null;
  }
}

async function getCollections(channelSlug: string): Promise<Collection[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/collections?channelSlug=${channelSlug}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.collections || [];
  } catch {
    return [];
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("channel");
  const tc = await getTranslations("common");

  const channel = await getChannel(slug);
  const collections = await getCollections(slug);

  if (!channel) {
    notFound();
  }

  const featuredCollections = collections.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav className="text-sm text-[var(--color-muted-foreground)]">
              <Link href="/" className="hover:text-[var(--color-foreground)]">
                {tc("nav.home")}
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-foreground)]">
                {channel.name}
              </span>
            </nav>
          </div>
        </div>

        <section className="border-b border-[var(--color-border)] py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {channel.name}
            </h1>
            <p className="text-[var(--color-muted-foreground)] text-lg mb-4">
              {channel.description}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {collections.length} {tc("stats.collections")} &middot;{" "}
              {collections.reduce((acc, c) => acc + (c.sourceCount || 0), 0)}{" "}
              {tc("stats.sources")}
            </p>
          </div>
        </section>

        {featuredCollections.length > 0 && (
          <section className="py-8 border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="font-display text-xl font-bold mb-6">
                {t("sections.featured")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/c/${slug}/${collection.slug}`}
                    className={cn(
                      "block p-5 border border-[var(--color-border)]",
                      "rounded-[var(--radius-md)]",
                      "hover:border-[var(--color-foreground)]",
                      "transition-colors group"
                    )}
                  >
                    <h3 className="font-medium text-lg mb-2 group-hover:text-[var(--color-accent)] transition-colors">
                      {collection.title}
                    </h3>
                    {collection.summary && (
                      <p className="text-sm text-[var(--color-muted-foreground)] mb-3 line-clamp-2">
                        {collection.summary}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {collection.createdAt && formatDate(collection.createdAt)}{" "}
                      &middot;{" "}
                      {t("collection.sources", { count: collection.sourceCount })}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      By {collection.by}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">
                {t("sections.allCollections")}
              </h2>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-[var(--radius-sm)]">
                  {t("sort.latest")}
                </button>
                <button className="px-3 py-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  {t("sort.popular")}
                </button>
                <button className="px-3 py-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  {t("sort.mostSources")}
                </button>
              </div>
            </div>

            {collections.length === 0 ? (
              <p className="text-[var(--color-muted-foreground)] py-8 text-center">
                {t("empty.noCollections")}
              </p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/c/${slug}/${collection.slug}`}
                    className="block py-4 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium group-hover:text-[var(--color-accent)] transition-colors">
                          {collection.title}
                        </h3>
                        {collection.summary && (
                          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 line-clamp-1">
                            {collection.summary}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
                          {collection.createdAt &&
                            formatDate(collection.createdAt)}{" "}
                          &middot;{" "}
                          {t("collection.sources", { count: collection.sourceCount })}{" "}
                          &middot; By {collection.by}
                        </p>
                      </div>
                      <span className="text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] group-hover:translate-x-1 transition-all">
                        &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
