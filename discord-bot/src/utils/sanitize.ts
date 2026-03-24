/**
 * Sanitizes a string by removing HTML tags, event attributes, and script content.
 * Robust against common XSS payloads.
 */
export function sanitize(text: string): string {
  // Remove <script>...</script> blocks (including content)
  let result = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove <style>...</style> blocks
  result = result.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove event handler attributes (onclick, onerror, onload, onmouseover, etc.)
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove javascript: and vbscript: protocol references in attributes
  result = result.replace(/\s+(?:href|src|action|formaction|data)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]*)/gi, "");
  result = result.replace(/\s+(?:href|src|action|formaction|data)\s*=\s*(?:"vbscript:[^"]*"|'vbscript:[^']*'|vbscript:[^\s>]*)/gi, "");

  // Remove all remaining HTML tags
  result = result.replace(/<[^>]+>/g, "");

  // Decode HTML entities that could be used to bypass filters, then re-sanitize
  result = result
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/gi, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  // After decoding, strip any newly revealed tags/scripts
  result = result.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");
  result = result.replace(/<[^>]+>/g, "");

  return result.trim();
}
