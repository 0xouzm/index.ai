"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { LocaleSwitcher } from "./locale-switcher";

const channels = [
  { name: "Programming", slug: "programming-ai" },
  { name: "Travel", slug: "travel" },
  { name: "Fitness", slug: "fitness" },
  { name: "Nutrition", slug: "nutrition" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-[var(--radius-sm)]",
        "hover:bg-[var(--color-muted)]",
        "transition-colors"
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export function Header() {
  const t = useTranslations("common");
  const { user, isLoading, logout } = useAuth();

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

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/manage"
              className={cn(
                "px-3 py-2 text-sm font-medium",
                "text-[var(--color-muted-foreground)]",
                "hover:text-[var(--color-foreground)]",
                "transition-colors hidden sm:block"
              )}
            >
              {t("nav.create")}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
            {isLoading ? (
              <div className="w-20 h-9" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-muted-foreground)] hidden sm:block">
                  {user.username}
                </span>
                <button
                  onClick={logout}
                  className={cn(
                    "px-4 py-2 text-sm font-medium",
                    "border border-[var(--color-border)]",
                    "rounded-[var(--radius-sm)]",
                    "hover:bg-[var(--color-muted)]",
                    "transition-colors duration-150"
                  )}
                >
                  {t("nav.signOut")}
                </button>
              </div>
            ) : (
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
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
