import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuthProvider } from "@/components/providers/auth-provider";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/config";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
