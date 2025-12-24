import { Context, Next } from "hono";
import type { Env } from "../types/env";

// Simple JWT verification (for production, use a proper JWT library)
interface JWTPayload {
  sub: string; // user id
  email: string;
  username: string;
  exp: number;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");

    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64)) as JWTPayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);

    if (!valid) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export async function createJWT(
  payload: Omit<JWTPayload, "exp">,
  secret: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    exp: now + expiresInSeconds,
  };

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify(fullPayload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", key, data);

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Auth middleware
export function authMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.substring(7);
    const secret = c.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET not configured");
      return c.json({ error: "Server configuration error" }, 500);
    }

    const payload = await verifyJWT(token, secret);

    if (!payload) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Add user info to context
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("username", payload.username);

    await next();
  };
}

// Optional auth middleware (doesn't fail if no token)
export function optionalAuthMiddleware() {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = c.env.JWT_SECRET;

      if (secret) {
        const payload = await verifyJWT(token, secret);
        if (payload) {
          c.set("userId", payload.sub);
          c.set("userEmail", payload.email);
          c.set("username", payload.username);
        }
      }
    }

    await next();
  };
}

// Password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    data,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);

    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      data,
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const hashArray = new Uint8Array(derivedBits);

    // Constant-time comparison
    if (hashArray.length !== storedHashBytes.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < hashArray.length; i++) {
      diff |= hashArray[i] ^ storedHashBytes[i];
    }

    return diff === 0;
  } catch {
    return false;
  }
}
