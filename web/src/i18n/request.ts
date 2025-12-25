import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const messages = {
    common: (await import(`../messages/${locale}/common.json`)).default,
    home: (await import(`../messages/${locale}/home.json`)).default,
    auth: (await import(`../messages/${locale}/auth.json`)).default,
    manage: (await import(`../messages/${locale}/manage.json`)).default,
    channel: (await import(`../messages/${locale}/channel.json`)).default,
    chat: (await import(`../messages/${locale}/chat.json`)).default,
  };

  return {
    locale,
    messages,
  };
});
