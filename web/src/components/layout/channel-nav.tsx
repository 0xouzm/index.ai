"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types";
import { getChannels } from "@/lib/api";

interface ChannelNavProps {
  variant?: "header" | "footer";
  className?: string;
}

export function ChannelNav({ variant = "header", className }: ChannelNavProps) {
  const t = useTranslations("channel");
  const [channels, setChannels] = useState<Channel[]>([]);

  function getChannelName(channel: Channel): string {
    // Use i18n translation, fallback to database name
    try {
      return t(`names.${channel.slug}`);
    } catch {
      return channel.name;
    }
  }

  useEffect(() => {
    async function fetchChannels() {
      const result = await getChannels();
      if (result.data) {
        setChannels(result.data);
      }
    }
    fetchChannels();
  }, []);

  if (channels.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-1",
          variant === "header" && "bg-[var(--color-muted)] rounded-full px-3 py-2",
          className
        )}
      >
        <span className="text-sm text-[var(--color-muted-foreground)]">
          Loading...
        </span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <nav
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm",
          className
        )}
      >
        {channels.map((channel, index) => (
          <span key={channel.id} className="flex items-center">
            <Link
              href={`/c/${channel.slug}`}
              className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors whitespace-nowrap"
            >
              {channel.emoji} {getChannelName(channel)}
            </Link>
            {index < channels.length - 1 && (
              <span className="mx-1 text-[var(--color-border-hover)]">/</span>
            )}
          </span>
        ))}
      </nav>
    );
  }

  // Header variant - 4chan style compact navigation
  return (
    <nav
      className={cn(
        "flex items-center gap-0.5 text-sm overflow-x-auto",
        "bg-[var(--color-muted)] rounded-full px-2 py-1.5",
        // Hide scrollbar
        "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
        className
      )}
    >
      {channels.map((channel, index) => (
        <span key={channel.id} className="flex items-center shrink-0">
          <Link
            href={`/c/${channel.slug}`}
            className={cn(
              "px-3 py-1.5 whitespace-nowrap rounded-full",
              "text-[var(--color-muted-foreground)]",
              "hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]",
              "transition-all duration-200"
            )}
          >
            <span className="mr-1">{channel.emoji}</span>
            {getChannelName(channel)}
          </Link>
          {index < channels.length - 1 && (
            <span className="text-[var(--color-border-hover)] mx-0.5">/</span>
          )}
        </span>
      ))}
    </nav>
  );
}
