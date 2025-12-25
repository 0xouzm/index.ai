import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Enable static exports for Cloudflare Pages
  // output: "export", // Uncomment for static export if not using SSR
};

export default withNextIntl(nextConfig);
