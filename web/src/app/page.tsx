import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { mockChannels, mockCollections } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-[var(--color-border)] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Index.ai
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-muted-foreground)] max-w-2xl mx-auto mb-8">
              AI-powered knowledge portal. Curated collections across
              programming, travel, fitness, and nutrition.
            </p>
            <Link
              href="#channels"
              className={cn(
                "inline-flex items-center px-6 py-3",
                "bg-[var(--color-foreground)] text-[var(--color-background)]",
                "font-medium rounded-[var(--radius-sm)]",
                "hover:opacity-90 transition-opacity"
              )}
            >
              Explore Collections
            </Link>
          </div>
        </section>

        {/* Channels Grid */}
        <section id="channels" className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {mockChannels.map((channel) => {
                const collections = mockCollections[channel.slug] || [];
                return (
                  <article
                    key={channel.id}
                    className="border-t-2 border-[var(--color-foreground)] pt-4"
                  >
                    {/* Channel Header */}
                    <div className="mb-4">
                      <Link
                        href={`/c/${channel.slug}`}
                        className="group inline-flex items-center gap-2"
                      >
                        <h2 className="font-display text-xl font-bold">
                          {channel.name}
                        </h2>
                        <span className="text-[var(--color-muted-foreground)] group-hover:translate-x-1 transition-transform">
                          &rarr;
                        </span>
                      </Link>
                      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                        {channel.description}
                      </p>
                    </div>

                    {/* Collection List */}
                    <ul className="space-y-3">
                      {collections.slice(0, 4).map((collection) => (
                        <li key={collection.id}>
                          <Link
                            href={`/c/${channel.slug}/${collection.slug}`}
                            className="group block"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                                  {collection.title}
                                </h3>
                                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                                  {formatDate(collection.createdAt)} &middot;{" "}
                                  {collection.sourceCount} sources &middot; By{" "}
                                  {collection.by}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* View All Link */}
                    {collections.length > 4 && (
                      <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                        <Link
                          href={`/c/${channel.slug}`}
                          className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                        >
                          View all {channel.collectionCount} collections &rarr;
                        </Link>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="border-t border-[var(--color-border)] py-12 bg-[var(--color-muted)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-2xl font-bold mb-2">
              Weekly Knowledge Digest
            </h2>
            <p className="text-[var(--color-muted-foreground)] mb-6 max-w-md mx-auto">
              Get curated insights delivered to your inbox every week.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className={cn(
                  "flex-1 px-4 py-2",
                  "bg-[var(--color-background)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              />
              <button
                className={cn(
                  "px-6 py-2",
                  "bg-[var(--color-foreground)] text-[var(--color-background)]",
                  "font-medium rounded-[var(--radius-sm)]",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
