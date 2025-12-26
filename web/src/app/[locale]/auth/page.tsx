"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export const runtime = "edge";

export default function AuthPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login, register, user, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect to home if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-muted-foreground)]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      if (formData.password !== formData.confirmPassword) {
        setError(t("errors.passwordMismatch"));
        return;
      }
      if (formData.password.length < 8) {
        setError(t("errors.passwordTooShort"));
        return;
      }
      if (formData.username.length < 3) {
        setError(t("errors.usernameTooShort"));
        return;
      }
    }

    setLoading(true);

    if (mode === "login") {
      const result = await login(formData.email, formData.password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } else {
      const result = await register(
        formData.email,
        formData.username,
        formData.password
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold">
              {mode === "login" ? t("login.title") : t("register.title")}
            </h1>
            <p className="text-[var(--color-muted-foreground)] mt-2">
              {mode === "login"
                ? t("login.subtitle")
                : t("register.subtitle")}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex mb-6 bg-[var(--color-muted)] rounded-[var(--radius-sm)] p-1">
            <button
              onClick={() => setMode("login")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors",
                mode === "login"
                  ? "bg-[var(--color-background)] shadow-sm"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              {t("buttons.signIn")}
            </button>
            <button
              onClick={() => setMode("register")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-[var(--radius-sm)] transition-colors",
                mode === "register"
                  ? "bg-[var(--color-background)] shadow-sm"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              {t("buttons.createAccount")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t("form.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t("form.emailPlaceholder")}
                required
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("form.username")}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder={t("form.usernamePlaceholder")}
                  required
                  className={cn(
                    "w-full px-4 py-2",
                    "bg-[var(--color-muted)] border border-[var(--color-border)]",
                    "rounded-[var(--radius-sm)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {t("form.password")}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={t("form.passwordPlaceholder")}
                required
                className={cn(
                  "w-full px-4 py-2",
                  "bg-[var(--color-muted)] border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                )}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("form.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder={t("form.passwordPlaceholder")}
                  required
                  className={cn(
                    "w-full px-4 py-2",
                    "bg-[var(--color-muted)] border border-[var(--color-border)]",
                    "rounded-[var(--radius-sm)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  )}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-[var(--radius-sm)] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3",
                "bg-[var(--color-foreground)] text-[var(--color-background)]",
                "font-medium rounded-[var(--radius-sm)]",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading
                ? t("buttons.processing")
                : mode === "login"
                  ? t("buttons.signIn")
                  : t("buttons.createAccount")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
            <Link href="/" className="hover:text-[var(--color-foreground)]">
              {t("buttons.backToHome")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
