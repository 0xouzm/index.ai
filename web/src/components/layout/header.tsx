"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const channels = [
  { name: "Programming", slug: "programming-ai" },
  { name: "Travel", slug: "travel" },
  { name: "Fitness", slug: "fitness" },
  { name: "Nutrition", slug: "nutrition" },
];

export function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">
              Index.ai
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {channels.map((channel) => (
              <Link
                key={channel.slug}
                href={`/c/${channel.slug}`}
                className={cn(
                  "px-3 py-2 text-sm font-medium",
                  "text-[var(--color-muted-foreground)]",
                  "hover:text-[var(--color-foreground)]",
                  "transition-colors duration-150"
                )}
              >
                {channel.name}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className={cn(
                "px-4 py-2 text-sm font-medium",
                "border border-[var(--color-border)]",
                "rounded-[var(--radius-sm)]",
                "hover:bg-[var(--color-muted)]",
                "transition-colors duration-150"
              )}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
