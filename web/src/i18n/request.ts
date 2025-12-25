import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = {
    ...(await import(`../messages/${locale}/common.json`)).default,
    ...(await import(`../messages/${locale}/home.json`)).default,
    ...(await import(`../messages/${locale}/auth.json`)).default,
    ...(await import(`../messages/${locale}/manage.json`)).default,
    ...(await import(`../messages/${locale}/channel.json`)).default,
    ...(await import(`../messages/${locale}/chat.json`)).default,
  };

  return {
    locale,
    messages,
  };
});
