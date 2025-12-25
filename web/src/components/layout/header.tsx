"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { LocaleSwitcher } from "./locale-switcher";

const channels = [
  { name: "Programming", slug: "programming-ai", emoji: "💻" },
  { name: "Travel", slug: "travel", emoji: "✈️" },
  { name: "Fitness", slug: "fitness", emoji: "💪" },
  { name: "Nutrition", slug: "nutrition", emoji: "🥗" },
];

export function Header() {
  const t = useTranslations("common");
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
              <span className="text-white font-display font-bold text-lg">i</span>
            </div>
            <span className="font-display text-xl font-bold text-[var(--color-foreground)]">
              Index.ai
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--color-muted)] rounded-full px-1.5 py-1.5">
            {channels.map((channel) => (
              <Link
                key={channel.slug}
                href={`/c/${channel.slug}`}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-full",
                  "text-[var(--color-muted-foreground)]",
                  "hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]",
                  "transition-all duration-200"
                )}
              >
                <span className="mr-1.5">{channel.emoji}</span>
                {channel.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/manage"
              className={cn(
                "hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full",
                "bg-[var(--color-muted)] text-[var(--color-foreground)]",
                "hover:bg-[var(--color-border-hover)]",
                "transition-all duration-200"
              )}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t("nav.create")}
            </Link>
            <LocaleSwitcher />
            {isLoading ? (
              <div className="w-20 h-9" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-muted)] rounded-full">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#7EC8E3] flex items-center justify-center text-xs font-semibold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--color-foreground)]">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-full",
                    "text-[var(--color-muted-foreground)]",
                    "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                    "transition-all duration-200"
                  )}
                >
                  {t("nav.signOut")}
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className={cn(
                  "px-5 py-2.5 text-sm font-semibold rounded-full",
                  "bg-[var(--color-foreground)] text-[var(--color-background)]",
                  "hover:bg-[var(--color-foreground)]/90",
                  "shadow-sm hover:shadow-md",
                  "transition-all duration-200"
                )}
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
