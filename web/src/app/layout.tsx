import type { Metadata } from "next";
import "./globals.css";

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
  return children;
}
