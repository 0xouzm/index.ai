import { Hono } from "hono";
import type { AppEnv } from "../types/env";
import { toCamelCase } from "../utils/case-transform";

export const channelsRouter = new Hono<AppEnv>();

// Get all channels
channelsRouter.get("/", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM channels ORDER BY sort_order ASC, name ASC"
    ).all();

    return c.json({ channels: toCamelCase(results) });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return c.json({ error: "Failed to fetch channels" }, 500);
  }
});

// Get channel by slug
channelsRouter.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  try {
    const channel = await c.env.DB.prepare(
      "SELECT * FROM channels WHERE slug = ?"
    )
      .bind(slug)
      .first();

    if (!channel) {
      return c.json({ error: "Channel not found" }, 404);
    }

    // Get collection count
    const countResult = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM collections WHERE channel_id = ?"
    )
      .bind(channel.id)
      .first<{ count: number }>();

    return c.json({
      channel: toCamelCase({
        ...channel,
        collectionCount: countResult?.count || 0,
      }),
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    return c.json({ error: "Failed to fetch channel" }, 500);
  }
});
