import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getChannel, getCollections } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface ChannelPageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const channel = getChannel(slug);
  const collections = getCollections(slug);

  if (!channel) {
    notFound();
  }

  const featuredCollections = collections.slice(0, 3);
  const allCollections = collections;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <nav className="text-sm text-[var(--color-muted-foreground)]">
              <Link href="/" className="hover:text-[var(--color-foreground)]">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-[var(--color-foreground)]">
                {channel.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Channel Header */}
        <section className="border-b border-[var(--color-border)] py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              {channel.name}
            </h1>
            <p className="text-[var(--color-muted-foreground)] text-lg mb-4">
              {channel.description}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {channel.collectionCount} collections &middot;{" "}
              {collections.reduce((acc, c) => acc + c.sourceCount, 0)} total
              sources
            </p>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="py-8 border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-xl font-bold mb-6">Featured</h2>
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
                    {formatDate(collection.createdAt)} &middot;{" "}
                    {collection.sourceCount} sources
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    By {collection.by}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* All Collections */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">
                All Collections
              </h2>
              <div className="flex gap-2 text-sm">
                <button className="px-3 py-1 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-[var(--radius-sm)]">
                  Latest
                </button>
                <button className="px-3 py-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  Popular
                </button>
                <button className="px-3 py-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  Most Sources
                </button>
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {allCollections.map((collection) => (
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
                        {formatDate(collection.createdAt)} &middot;{" "}
                        {collection.sourceCount} sources &middot; By{" "}
                        {collection.by}
                      </p>
                    </div>
                    <span className="text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)] group-hover:translate-x-1 transition-all">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
