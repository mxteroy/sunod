export function normalize(text: string) {
  const lower = text.toLowerCase();
  // collapse whitespace, strip most punctuation but keep apostrophes for don’t/don't
  const stripped = lower
    .replace(/[^\p{L}\p{N}\s'’]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}
