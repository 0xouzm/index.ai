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
    // Use subquery to get actual document count instead of relying on source_count field
    let query = `
      SELECT c.id, c.channel_id, c.user_id, c.title, c.slug, c.by, c.type,
             c.visibility, c.vector_namespace, c.summary, c.created_at, c.updated_at,
             (SELECT COUNT(*) FROM documents d WHERE d.collection_id = c.id) as source_count,
             ch.slug as channel_slug, ch.name as channel_name
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
      `SELECT c.id, c.channel_id, c.user_id, c.title, c.slug, c.by, c.type,
              c.visibility, c.vector_namespace, c.summary, c.created_at, c.updated_at,
              ch.slug as channel_slug, ch.name as channel_name
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
        sourceCount: documents?.length || 0,
        documents,
      }),
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});

// Create collection
collectionsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      channelId: string;
      title: string;
      slug: string;
      by?: string;
      summary?: string;
    }>();

    const { channelId, title, slug, by, summary } = body;

    if (!channelId || !title || !slug) {
      return c.json({ error: "channelId, title, and slug are required" }, 400);
    }

    // Verify channel exists
    const channel = await c.env.DB.prepare("SELECT id FROM channels WHERE id = ?")
      .bind(channelId)
      .first();

    if (!channel) {
      return c.json({ error: "Channel not found" }, 404);
    }

    // Check slug uniqueness
    const existing = await c.env.DB.prepare(
      "SELECT id FROM collections WHERE slug = ? AND channel_id = ?"
    )
      .bind(slug, channelId)
      .first();

    if (existing) {
      return c.json({ error: "Collection with this slug already exists" }, 409);
    }

    const id = `col-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const vectorNamespace = `ns-${id}`;

    await c.env.DB.prepare(
      `INSERT INTO collections (id, channel_id, title, slug, by, type, visibility, vector_namespace, summary, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'user', 'public', ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(id, channelId, title, slug, by || "Anonymous", vectorNamespace, summary || null)
      .run();

    const collection = await c.env.DB.prepare("SELECT * FROM collections WHERE id = ?")
      .bind(id)
      .first();

    return c.json({ collection: toCamelCase(collection) }, 201);
  } catch (error) {
    console.error("Error creating collection:", error);
    return c.json({ error: "Failed to create collection" }, 500);
  }
});

// Get collection by channel slug and collection slug
collectionsRouter.get("/by-slug/:channelSlug/:collectionSlug", async (c) => {
  const channelSlug = c.req.param("channelSlug");
  const collectionSlug = c.req.param("collectionSlug");

  try {
    const collection = await c.env.DB.prepare(
      `SELECT c.id, c.channel_id, c.user_id, c.title, c.slug, c.by, c.type,
              c.visibility, c.vector_namespace, c.summary, c.created_at, c.updated_at,
              ch.slug as channel_slug, ch.name as channel_name
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
        sourceCount: documents?.length || 0,
        documents,
      }),
    });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return c.json({ error: "Failed to fetch collection" }, 500);
  }
});
