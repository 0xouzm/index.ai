/**
 * Citation format normalization utilities
 * Ensures consistent [N] format for all citations
 */

/**
 * Normalize citation formats to standard [N] format
 * Handles various LLM output formats:
 * - [Document 1], [Doc 1], [Document 1: title] -> [1]
 * - Document 1], Doc 1] (missing left bracket) -> [1]
 */
export function normalizeCitations(text: string): string {
  let result = text
    // Pattern 1: [Document N: ...] or [Doc N: ...] or [Document N] -> [N]
    .replace(/\[\s*(?:Doc(?:ument)?\s*)?(\d+)\s*(?::[^\]]+)?\s*\]/gi, "[$1]")
    // Pattern 2: Document N] or Doc N] (missing left bracket) -> [N]
    .replace(/\bDoc(?:ument)?\s*(\d+)\s*\]/gi, "[$1]");

  return result;
}

/**
 * Remove invalid citation fragments that couldn't be normalized
 * Cleans up orphaned "Document" or "Doc" text without valid format
 */
export function removeInvalidCitationFragments(text: string): string {
  return text
    // Remove standalone "Document" or "Doc" not followed by a number
    .replace(/\bDoc(?:ument)?\s*(?!\d)/gi, "")
    // Remove orphaned ] not part of citation
    .replace(/\s+\](?!\d)/g, " ")
    // Clean up multiple spaces
    .replace(/\s{2,}/g, " ");
}

/**
 * Renumber markdown lists to ensure sequential numbering (1. 2. 3.)
 * Fixes LLM "lazy numbering" where all items use "1."
 */
export function renumberLists(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let counter = 0;
  let inList = false;

  for (const line of lines) {
    // Match numbered list item with optional leading whitespace
    const match = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (match) {
      if (!inList) {
        inList = true;
        counter = 0;
      }
      counter++;
      result.push(`${match[1]}${counter}. ${match[3]}`);
    } else {
      // Empty line or non-list content resets list context
      if (line.trim() === "") {
        inList = false;
        counter = 0;
      }
      result.push(line);
    }
  }

  return result.join("\n");
}
