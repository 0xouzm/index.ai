"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { CollectionsTab } from "./components/collections-tab";
import { ChannelsTab } from "./components/channels-tab";
import { cn } from "@/lib/utils";

export const runtime = "edge";

type TabType = "collections" | "channels";

export default function ManagePage() {
  const t = useTranslations("manage");
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("collections");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [isLoading, user, router]);

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-muted-foreground)]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; labelKey: string; adminOnly?: boolean }[] = [
    { id: "collections", labelKey: "tabs.collections" },
    { id: "channels", labelKey: "tabs.channels", adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
                <p className="text-[var(--color-muted-foreground)] mt-1">
                  {isAdmin ? t("adminMode") : t("subtitle")}
                </p>
              </div>
              <Link
                href="/"
                className={cn(
                  "px-4 py-2 text-sm",
                  "border border-[var(--color-border)]",
                  "rounded-[var(--radius-sm)]",
                  "hover:bg-[var(--color-muted)] transition-colors"
                )}
              >
                {t("backToHome")}
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          {visibleTabs.length > 1 && (
            <div className="flex border-b border-[var(--color-border)] mb-6">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium -mb-px",
                    "border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-[var(--color-foreground)] text-[var(--color-foreground)]"
                      : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  )}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === "collections" && <CollectionsTab isAdmin={isAdmin} />}
          {activeTab === "channels" && isAdmin && <ChannelsTab />}
        </div>
      </main>
    </div>
  );
}
