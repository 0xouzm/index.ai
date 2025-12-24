import type { Channel, Collection, Document } from "@/types";

export const mockChannels: Channel[] = [
  {
    id: "ch-1",
    name: "Programming & AI",
    slug: "programming-ai",
    description: "Model architectures, engineering practices, and toolchains",
    collectionCount: 24,
  },
  {
    id: "ch-2",
    name: "Global Travel",
    slug: "travel",
    description: "Visa policies, travel guides, and destination insights",
    collectionCount: 18,
  },
  {
    id: "ch-3",
    name: "Hardcore Fitness",
    slug: "fitness",
    description: "Training protocols, nutrition science, and biomechanics",
    collectionCount: 15,
  },
  {
    id: "ch-4",
    name: "Clean Eating",
    slug: "nutrition",
    description: "Research reviews, ingredient analysis, and healthy recipes",
    collectionCount: 12,
  },
];

export const mockCollections: Record<string, Collection[]> = {
  "programming-ai": [
    {
      id: "col-1",
      channelId: "ch-1",
      title: "DeepSeek Technical Papers",
      slug: "deepseek-papers",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 14,
      summary:
        "Complete collection of DeepSeek's technical papers including DeepSeek-V3, MoE architecture, and training methodologies.",
      createdAt: "2025-07-03T00:00:00Z",
      updatedAt: "2025-07-03T00:00:00Z",
    },
    {
      id: "col-2",
      channelId: "ch-1",
      title: "Claude Technical Archive",
      slug: "claude-archive",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 23,
      summary:
        "Official Anthropic publications on Claude, constitutional AI, and safety research.",
      createdAt: "2025-06-15T00:00:00Z",
      updatedAt: "2025-06-20T00:00:00Z",
    },
    {
      id: "col-3",
      channelId: "ch-1",
      title: "RAG Implementation Guide",
      slug: "rag-guide",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 31,
      summary:
        "Comprehensive guide to building production RAG systems with best practices.",
      createdAt: "2025-05-10T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    },
    {
      id: "col-4",
      channelId: "ch-1",
      title: "Prompt Engineering Patterns",
      slug: "prompt-patterns",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 18,
      createdAt: "2025-04-20T00:00:00Z",
      updatedAt: "2025-05-15T00:00:00Z",
    },
  ],
  travel: [
    {
      id: "col-5",
      channelId: "ch-2",
      title: "Southeast Asia Digital Nomad Guide",
      slug: "sea-nomad",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 42,
      summary:
        "Visa policies, co-working spaces, and living costs across Thailand, Vietnam, Indonesia, and more.",
      createdAt: "2025-06-01T00:00:00Z",
      updatedAt: "2025-07-01T00:00:00Z",
    },
    {
      id: "col-6",
      channelId: "ch-2",
      title: "Schengen Visa Archive",
      slug: "schengen-visa",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 28,
      createdAt: "2025-05-15T00:00:00Z",
      updatedAt: "2025-06-10T00:00:00Z",
    },
    {
      id: "col-7",
      channelId: "ch-2",
      title: "Japan Long-term Visa Guide",
      slug: "japan-visa",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 19,
      createdAt: "2025-04-10T00:00:00Z",
      updatedAt: "2025-05-20T00:00:00Z",
    },
  ],
  fitness: [
    {
      id: "col-8",
      channelId: "ch-3",
      title: "Strength Training Science",
      slug: "strength-science",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 36,
      summary:
        "Evidence-based strength training principles from PubMed and NSCA.",
      createdAt: "2025-06-20T00:00:00Z",
      updatedAt: "2025-07-05T00:00:00Z",
    },
    {
      id: "col-9",
      channelId: "ch-3",
      title: "Hypertrophy Research Review",
      slug: "hypertrophy-research",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 24,
      createdAt: "2025-05-01T00:00:00Z",
      updatedAt: "2025-06-15T00:00:00Z",
    },
    {
      id: "col-10",
      channelId: "ch-3",
      title: "Nutrition & Recovery",
      slug: "nutrition-recovery",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 21,
      createdAt: "2025-04-15T00:00:00Z",
      updatedAt: "2025-05-30T00:00:00Z",
    },
  ],
  nutrition: [
    {
      id: "col-11",
      channelId: "ch-4",
      title: "Food Additives Archive",
      slug: "food-additives",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 45,
      summary: "FDA and EFSA evaluations of common food additives and their safety profiles.",
      createdAt: "2025-06-10T00:00:00Z",
      updatedAt: "2025-07-02T00:00:00Z",
    },
    {
      id: "col-12",
      channelId: "ch-4",
      title: "Ingredient Analysis",
      slug: "ingredient-analysis",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 32,
      createdAt: "2025-05-20T00:00:00Z",
      updatedAt: "2025-06-25T00:00:00Z",
    },
    {
      id: "col-13",
      channelId: "ch-4",
      title: "Healthy Recipe Collection",
      slug: "healthy-recipes",
      by: "Index.ai",
      type: "official",
      visibility: "public",
      sourceCount: 58,
      createdAt: "2025-04-01T00:00:00Z",
      updatedAt: "2025-06-30T00:00:00Z",
    },
  ],
};

export const mockDocuments: Record<string, Document[]> = {
  "col-1": [
    {
      id: "doc-1",
      collectionId: "col-1",
      title: "DeepSeek-V3 Technical Report",
      sourceType: "pdf",
      sourceUrl: "https://arxiv.org/abs/2412.19437",
      summary: "Technical report on DeepSeek-V3, a Mixture-of-Experts model with 671B total parameters.",
      chunkCount: 45,
      tokenCount: 28000,
      createdAt: "2025-07-01T00:00:00Z",
    },
    {
      id: "doc-2",
      collectionId: "col-1",
      title: "DeepSeek MoE Architecture",
      sourceType: "pdf",
      sourceUrl: "https://arxiv.org/abs/2401.02954",
      summary: "Detailed analysis of the DeepSeek MoE architecture and training methodology.",
      chunkCount: 32,
      tokenCount: 19500,
      createdAt: "2025-06-15T00:00:00Z",
    },
    {
      id: "doc-3",
      collectionId: "col-1",
      title: "DeepSeek Coder v2",
      sourceType: "pdf",
      sourceUrl: "https://arxiv.org/abs/2406.11931",
      summary: "Code-focused model with improved performance on programming tasks.",
      chunkCount: 28,
      tokenCount: 16800,
      createdAt: "2025-06-10T00:00:00Z",
    },
  ],
};

export function getChannel(slug: string): Channel | undefined {
  return mockChannels.find((c) => c.slug === slug);
}

export function getCollections(channelSlug: string): Collection[] {
  return mockCollections[channelSlug] || [];
}

export function getCollection(channelSlug: string, collectionSlug: string): Collection | undefined {
  const collections = mockCollections[channelSlug] || [];
  return collections.find((c) => c.slug === collectionSlug);
}

export function getDocuments(collectionId: string): Document[] {
  return mockDocuments[collectionId] || [];
}
