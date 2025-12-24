import type {
  Channel,
  Collection,
  Document,
  ChatMessage,
  Citation,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("API Error:", error);
    return { error: "Network error" };
  }
}

// Channels
export async function getChannels(): Promise<ApiResponse<Channel[]>> {
  const result = await fetchApi<{ channels: Channel[] }>("/api/v1/channels");
  return result.data ? { data: result.data.channels } : result;
}

export async function getChannel(slug: string): Promise<ApiResponse<Channel>> {
  const result = await fetchApi<{ channel: Channel }>(
    `/api/v1/channels/${slug}`
  );
  return result.data ? { data: result.data.channel } : result;
}

// Collections
export async function getCollections(
  channelSlug?: string
): Promise<ApiResponse<Collection[]>> {
  const params = channelSlug ? `?channelSlug=${channelSlug}` : "";
  const result = await fetchApi<{ collections: Collection[] }>(
    `/api/v1/collections${params}`
  );
  return result.data ? { data: result.data.collections } : result;
}

export async function getCollection(
  channelSlug: string,
  collectionSlug: string
): Promise<ApiResponse<Collection & { documents: Document[] }>> {
  const result = await fetchApi<{
    collection: Collection & { documents: Document[] };
  }>(`/api/v1/collections/by-slug/${channelSlug}/${collectionSlug}`);
  return result.data ? { data: result.data.collection } : result;
}

export async function getCollectionById(
  id: string
): Promise<ApiResponse<Collection & { documents: Document[] }>> {
  const result = await fetchApi<{
    collection: Collection & { documents: Document[] };
  }>(`/api/v1/collections/${id}`);
  return result.data ? { data: result.data.collection } : result;
}

// Chat
export interface ChatQueryRequest {
  collectionId: string;
  question: string;
  documentIds?: string[];
  conversationId?: string;
}

export interface ChatQueryResponse {
  answer: string;
  citations: Citation[];
  source: "archive" | "web";
  conversationId: string;
}

export async function sendChatQuery(
  request: ChatQueryRequest
): Promise<ApiResponse<ChatQueryResponse>> {
  return fetchApi<ChatQueryResponse>("/api/v1/chat/query", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Auth (placeholder)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token: string;
}

export async function login(
  request: LoginRequest
): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function register(request: {
  email: string;
  username: string;
  password: string;
}): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getCurrentUser(): Promise<
  ApiResponse<{ id: string; email: string; username: string }>
> {
  return fetchApi("/api/v1/auth/me");
}
