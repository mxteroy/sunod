export const ACCESS_TOKEN_TTL_SEC = 15 * 60; // 15 min
export const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

export const ACCESS_COOKIE = "acc"; // httpOnly
export const REFRESH_COOKIE = "ref"; // httpOnly
export const GUEST_COOKIE = "gid"; // signed ID for guest reuse

export const JWT_AUDIENCE = "sunod-api";
export const JWT_ISSUER = "sunod-auth";

export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? undefined; // e.g. .sunod.ai
export const IS_PROD = process.env.NODE_ENV === "production";
