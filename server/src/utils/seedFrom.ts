import crypto from "crypto"; // for reproducible seeds

export function seedFrom(...parts: (string | number | undefined)[]) {
  const hex = crypto
    .createHash("sha256")
    .update(parts.filter((p) => p !== undefined).join("|"))
    .digest("hex")
    .slice(0, 8);
  return parseInt(hex, 16);
}
