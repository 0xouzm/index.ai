import { Hono } from "hono";
import type { AppEnv } from "../types/env";
import { toCamelCase } from "../utils/case-transform";

export const collectionsRouter = new Hono<AppEnv>();

// Get collections (with optional channel filter)
collectionsRouter.get("/", async (c) => {
  const channelId = c.req.query("channelId");
  const channelSlug = c.req.query("channelSlug");
  const visibility = c.req.query("visibility") || "public";

  try {
    let query = `
      SELECT c.*, ch.slug as channel_slug, ch.name as channel_name
      FROM collections c
      JOIN channels ch ON c.channel_id = ch.id
      WHERE c.visibility = ?
    `;
    const params: string[] = [visibility];

    if (channelId) {
      query += " AND c.channel_id = ?";
      params.push(channelId);
    } else if (channelSlug) {
      query += " AND ch.slug = ?";
      params.push(channelSlug);
    }

    query += " ORDER BY c.created_at DESC";

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return c.json({ collections: toCamelCase(results) });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return c.json({ error: "Failed to fetch collections" }, 500);
  }
});

// Get collection by ID
collectionsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const collection = await c.env.DB.prepare(
      `SELECT c.*, ch.slug as channel_slug, ch.name as channel_name
       FROM collections c
       JOIN channels ch ON c.channel_id = ch.id
       WHERE c.id = ?`
    )
      .bind(id)
      .first();

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    // Get documents
    const { results: documents } = await c.env.DB.prepare(
      "SELECT * FROM documents WHERE collection_id = ? ORDER BY created_at DESC"
    )
      .bind(id)
      .all();

    return c.json({
      collection: toCamelCase({
        ...collection,
        documents,
      }),
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

// Get collection by channel slug and collection slug
collectionsRouter.get("/by-slug/:channelSlug/:collectionSlug", async (c) => {
  const channelSlug = c.req.param("channelSlug");
  const collectionSlug = c.req.param("collectionSlug");

  try {
    const collection = await c.env.DB.prepare(
      `SELECT c.*, ch.slug as channel_slug, ch.name as channel_name
       FROM collections c
       JOIN channels ch ON c.channel_id = ch.id
       WHERE ch.slug = ? AND c.slug = ?`
    )
      .bind(channelSlug, collectionSlug)
      .first();

    if (!collection) {
      return c.json({ error: "Collection not found" }, 404);
    }

    // Get documents
    const { results: documents } = await c.env.DB.prepare(
      "SELECT * FROM documents WHERE collection_id = ? ORDER BY created_at DESC"
    )
      .bind(collection.id)
      .all();

    return c.json({
      collection: toCamelCase({
        ...collection,
        documents,
      }),
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});
