import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Index.ai - AI-Powered Knowledge Portal",
  description:
    "Discover curated knowledge collections across programming, travel, fitness, and nutrition. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-body">
        {children}
      </body>
    </html>
  );
}
