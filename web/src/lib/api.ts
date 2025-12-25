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

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
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
  return result.data ? { data: result.data.channels } : { error: result.error };
}

export async function getChannel(slug: string): Promise<ApiResponse<Channel>> {
  const result = await fetchApi<{ channel: Channel }>(
    `/api/v1/channels/${slug}`
  );
  return result.data ? { data: result.data.channel } : { error: result.error };
}

// Collections
export async function getCollections(
  channelSlug?: string
): Promise<ApiResponse<Collection[]>> {
  const params = channelSlug ? `?channelSlug=${channelSlug}` : "";
  const result = await fetchApi<{ collections: Collection[] }>(
    `/api/v1/collections${params}`
  );
  return result.data ? { data: result.data.collections } : { error: result.error };
}

export async function getCollection(
  channelSlug: string,
  collectionSlug: string
): Promise<ApiResponse<Collection & { documents: Document[] }>> {
  const result = await fetchApi<{
    collection: Collection & { documents: Document[] };
  }>(`/api/v1/collections/by-slug/${channelSlug}/${collectionSlug}`);
  return result.data ? { data: result.data.collection } : { error: result.error };
}

export async function getCollectionById(
  id: string
): Promise<ApiResponse<Collection & { documents: Document[] }>> {
  const result = await fetchApi<{
    collection: Collection & { documents: Document[] };
  }>(`/api/v1/collections/${id}`);
  return result.data ? { data: result.data.collection } : { error: result.error };
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

// Streaming chat query
export interface StreamEvent {
  type: "start" | "content" | "end" | "error";
  source?: "archive" | "web";
  conversationId?: string;
  content?: string;
  citations?: Citation[];
  error?: string;
}

export async function sendChatQueryStream(
  request: ChatQueryRequest,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/chat/query/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6)) as StreamEvent;
          onEvent(event);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
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

// Documents
export interface CreateDocumentRequest {
  collectionId: string;
  title: string;
  sourceType: "url" | "markdown";
  content?: string;
  sourceUrl?: string;
}

export interface DocumentResponse {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl?: string;
  chunkCount: number;
  tokenCount: number;
  status: string;
}

export async function createDocument(
  request: CreateDocumentRequest
): Promise<ApiResponse<{ document: DocumentResponse }>> {
  return fetchApi("/api/v1/documents", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getDocuments(
  collectionId: string
): Promise<ApiResponse<{ documents: Document[] }>> {
  return fetchApi(`/api/v1/documents?collectionId=${collectionId}`);
}

export async function deleteDocument(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/api/v1/documents/${id}`, { method: "DELETE" });
}

// Collections management
export interface CreateCollectionRequest {
  channelId: string;
  title: string;
  slug: string;
  summary?: string;
}

export async function createCollection(
  request: CreateCollectionRequest
): Promise<ApiResponse<{ collection: Collection }>> {
  return fetchApi("/api/v1/collections", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
