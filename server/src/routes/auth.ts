import { Hono } from "hono";
import type { AppEnv } from "../types/env";
import {
  createJWT,
  hashPassword,
  verifyPassword,
  authMiddleware,
} from "../middleware/auth";

export const authRouter = new Hono<AppEnv>();

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Register
authRouter.post("/register", async (c) => {
  try {
    const body = await c.req.json<RegisterRequest>();
    const { email, username, password } = body;

    // Validation
    if (!email || !username || !password) {
      return c.json({ error: "Email, username, and password are required" }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    if (username.length < 3 || username.length > 50) {
      return c.json({ error: "Username must be 3-50 characters" }, 400);
    }

    // Check if email or username already exists
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ? OR username = ?"
    )
      .bind(email, username)
      .first();

    if (existing) {
      return c.json({ error: "Email or username already exists" }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, username, password_hash)
       VALUES (?, ?, ?, ?)`
    )
      .bind(userId, email, username, passwordHash)
      .run();

    // Create JWT
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ error: "Server configuration error" }, 500);
    }

    const token = await createJWT(
      { sub: userId, email, username },
      secret,
      7 * 24 * 3600 // 7 days
    );

    return c.json({
      user: { id: userId, email, username },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login
authRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json<LoginRequest>();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Find user
    const user = await c.env.DB.prepare(
      "SELECT id, email, username, password_hash FROM users WHERE email = ?"
    )
      .bind(email)
      .first<{
        id: string;
        email: string;
        username: string;
        password_hash: string;
      }>();

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Create JWT
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ error: "Server configuration error" }, 500);
    }

    const token = await createJWT(
      { sub: user.id, email: user.email, username: user.username },
      secret,
      7 * 24 * 3600 // 7 days
    );

    return c.json({
      user: { id: user.id, email: user.email, username: user.username },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get current user (protected)
authRouter.get("/me", authMiddleware(), async (c) => {
  const userId = c.get("userId");
  const email = c.get("userEmail");
  const username = c.get("username");

  return c.json({
    id: userId,
    email,
    username,
  });
});

// Refresh token (protected)
authRouter.post("/refresh", authMiddleware(), async (c) => {
  const userId = c.get("userId") as string;
  const email = c.get("userEmail") as string;
  const username = c.get("username") as string;

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "Server configuration error" }, 500);
  }

  const token = await createJWT(
    { sub: userId, email, username },
    secret,
    7 * 24 * 3600
  );

  return c.json({ token });
});
