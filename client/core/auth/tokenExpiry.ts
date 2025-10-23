// tokenExpiry.ts
export function getJwtExpSeconds(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(atob(payload));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}
