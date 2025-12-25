/**
 * PDF content extractor using unpdf
 * Extracts text content from PDF files
 */

import { extractText, getDocumentProxy } from "unpdf";

export interface PDFContent {
  title?: string;
  author?: string;
  pageCount: number;
  content: string;
  pages: string[];
}

/**
 * Extract content from a PDF buffer
 */
export async function extractFromPdf(buffer: ArrayBuffer): Promise<PDFContent> {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);

  // Extract text from all pages
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];

  // Merge pages with separators
  const mergedContent = pages
    .map((pageText, index) => {
      const trimmed = pageText.trim();
      if (!trimmed) return "";
      return `## Page ${index + 1}\n\n${trimmed}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  // Try to extract title from first page content
  const firstPageLines = pages[0]?.split("\n").filter((l) => l.trim()) || [];
  const possibleTitle = firstPageLines[0]?.trim();

  return {
    title: possibleTitle && possibleTitle.length < 200 ? possibleTitle : undefined,
    pageCount: totalPages,
    content: mergedContent || pages.join("\n\n"),
    pages,
  };
}

/**
 * Extract content from a PDF stored in R2
 */
export async function extractFromR2(
  bucket: R2Bucket,
  key: string
): Promise<PDFContent> {
  const object = await bucket.get(key);

  if (!object) {
    throw new Error(`PDF not found in R2: ${key}`);
  }

  const buffer = await object.arrayBuffer();
  return extractFromPdf(buffer);
}
