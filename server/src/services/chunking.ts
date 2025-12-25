/**
 * Document chunking service
 * Splits documents into semantically meaningful chunks for embedding
 */

export interface Chunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
    section?: string;
  };
}

export interface ChunkingOptions {
  maxChunkSize?: number;      // Max characters per chunk (default: 2000)
  chunkOverlap?: number;      // Overlap between chunks (default: 300)
  minChunkSize?: number;      // Min characters to form a chunk (default: 150)
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxChunkSize: 2000,   // Increased from 1500 for better context
  chunkOverlap: 300,    // Increased from 200 for better continuity
  minChunkSize: 150,    // Increased from 100 to avoid tiny chunks
};

/**
 * Split text into chunks using semantic boundaries
 */
export function chunkText(text: string, options?: ChunkingOptions): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: Chunk[] = [];

  // Normalize text
  const normalizedText = text.replace(/\r\n/g, "\n").trim();

  if (normalizedText.length <= opts.maxChunkSize) {
    return [{
      content: normalizedText,
      index: 0,
      metadata: { startChar: 0, endChar: normalizedText.length },
    }];
  }

  // Split by semantic boundaries (paragraphs, then sentences)
  const paragraphs = splitByParagraphs(normalizedText);
  let currentChunk = "";
  let chunkStart = 0;
  let charOffset = 0;

  for (const para of paragraphs) {
    // If adding this paragraph exceeds max size, finalize current chunk
    if (currentChunk.length + para.length > opts.maxChunkSize && currentChunk.length >= opts.minChunkSize) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunks.length,
        metadata: { startChar: chunkStart, endChar: charOffset },
      });

      // Start new chunk with overlap
      const overlapText = getOverlapText(currentChunk, opts.chunkOverlap);
      currentChunk = overlapText;
      chunkStart = charOffset - overlapText.length;
    }

    // If single paragraph is too long, split by sentences
    if (para.length > opts.maxChunkSize) {
      const sentences = splitBySentences(para);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > opts.maxChunkSize && currentChunk.length >= opts.minChunkSize) {
          chunks.push({
            content: currentChunk.trim(),
            index: chunks.length,
            metadata: { startChar: chunkStart, endChar: charOffset },
          });
          const overlapText = getOverlapText(currentChunk, opts.chunkOverlap);
          currentChunk = overlapText;
          chunkStart = charOffset - overlapText.length;
        }
        currentChunk += sentence;
        charOffset += sentence.length;
      }
    } else {
      currentChunk += para + "\n\n";
      charOffset += para.length + 2;
    }
  }

  // Add remaining content
  if (currentChunk.trim().length >= opts.minChunkSize) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunks.length,
      metadata: { startChar: chunkStart, endChar: charOffset },
    });
  }

  return chunks;
}

/**
 * Split markdown content with heading awareness
 */
export function chunkMarkdown(markdown: string, options?: ChunkingOptions): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: Chunk[] = [];

  // Split by headings first
  const sections = splitByHeadings(markdown);

  for (const section of sections) {
    const sectionChunks = chunkText(section.content, opts);
    for (const chunk of sectionChunks) {
      chunks.push({
        ...chunk,
        index: chunks.length,
        metadata: {
          ...chunk.metadata,
          section: section.heading,
        },
      });
    }
  }

  return chunks;
}

// Helper functions

function splitByParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
}

function splitBySentences(text: string): string[] {
  // Split on sentence boundaries while preserving the delimiter
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  return sentences.filter(s => s.trim().length > 0);
}

function splitByHeadings(markdown: string): { heading?: string; content: string }[] {
  const sections: { heading?: string; content: string }[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;

  let lastIndex = 0;
  let lastHeading: string | undefined;
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    // Save content before this heading
    if (match.index > lastIndex) {
      const content = markdown.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({ heading: lastHeading, content });
      }
    }
    lastHeading = match[2];
    lastIndex = match.index + match[0].length;
  }

  // Save remaining content
  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ heading: lastHeading, content: remaining });
  }

  // If no headings found, return entire content
  if (sections.length === 0) {
    sections.push({ content: markdown });
  }

  return sections;
}

function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;

  // Try to break at word boundary
  const overlap = text.slice(-overlapSize);
  const wordBreak = overlap.indexOf(" ");

  if (wordBreak > 0 && wordBreak < overlapSize / 2) {
    return overlap.slice(wordBreak + 1);
  }

  return overlap;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  // This is a simplification; actual tokenization varies by model
  return Math.ceil(text.length / 4);
}
