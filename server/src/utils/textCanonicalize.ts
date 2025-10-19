// Cheap, deterministic normalization for chatty text.
// Handles: unicode, diacritics, confusables, elongations ("soooo"), spacing.

export function canonicalize(raw: string): string {
  if (!raw) return "";

  // 1) Unicode normalize + fold confusables
  let s = raw
    .normalize("NFKC")
    // Strip combining marks (accents): café -> cafe
    .replace(/\p{M}+/gu, "")
    // Common confusables to ASCII
    .replace(/[“”„‟]/g, '"')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[—–‐]/g, "-")
    .replace(/[…]/g, "...")
    .replace(/[@]/g, "@");

  // 2) Lowercase
  s = s.toLowerCase();

  // 3) Collapse letter elongations:
  // keep double letters but squash 3+ to a single (cool -> cool, coooool -> cool)
  s = s.replace(/([a-z])\1{2,}/g, "$1");

  // 4) Collapse punctuation runs and whitespace
  s = s
    .replace(/[^\p{L}\p{N}@#\s.'-]/gu, " ") // keep a few symbols that matter
    .replace(/[\s.'-]{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return s;
}
