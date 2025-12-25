// Channel
export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  collectionCount: number;
}

// Collection
export type CollectionType = "official" | "user";
export type CollectionVisibility = "public" | "private";

export interface Collection {
  id: string;
  channelId: string;
  title: string;
  slug: string;
  by: string;
  type: CollectionType;
  visibility: CollectionVisibility;
  sourceCount: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// Document
export type SourceType = "pdf" | "url" | "markdown";

export interface Document {
  id: string;
  collectionId: string;
  title: string;
  sourceType: SourceType;
  sourceUrl?: string;
  summary?: string;
  topics?: string[];
  content?: string;
  processedContent?: string;
  chunkCount: number;
  tokenCount: number;
  createdAt: string;
}

// User
export interface User {
  id: string;
  username: string;
  email: string;
}

// Purchase
export type PurchaseScope = "platform" | "channel";
export type PurchaseType = "one_time" | "subscription";

export interface Purchase {
  id: string;
  userId: string;
  scope: PurchaseScope;
  channelId?: string;
  type: PurchaseType;
  createdAt: string;
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  source?: "archive" | "web";
  createdAt: string;
}

export interface Citation {
  sourceIndex: number; // 1-based index matching [N] in the answer
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  expandedContent?: string; // Expanded content with surrounding context
  page?: number;
}

// Comment
export interface Comment {
  id: string;
  userId: string;
  username: string;
  collectionId: string;
  parentId?: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}
