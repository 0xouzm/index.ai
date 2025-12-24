import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./types/env";
import { authRouter } from "./routes/auth";
import { channelsRouter } from "./routes/channels";
import { collectionsRouter } from "./routes/collections";
import { chatRouter } from "./routes/chat";

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://index.ai"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "Index.ai API",
    version: "0.1.0",
    status: "ok",
  });
});

// API Routes
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/channels", channelsRouter);
app.route("/api/v1/collections", collectionsRouter);
app.route("/api/v1/chat", chatRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
