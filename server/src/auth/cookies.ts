import { CookieOptions, Response } from "express";
import {
  COOKIE_DOMAIN,
  IS_PROD,
  REFRESH_COOKIE,
  REFRESH_TOKEN_TTL_SEC,
} from "./constants";

/**
 * If your SPA and API are on different origins, set crossSite=true.
 * For same-origin deployments you can leave it false to use Lax.
 */
const makeBase = (crossSite: boolean): CookieOptions => ({
  httpOnly: true, // Prevents JavaScript (document.cookie) from reading/writing it. Good for security.
  // Only send over HTTPS. Required for SameSite=None in modern browsers.
  secure: IS_PROD || crossSite, // required when SameSite=None
  //  Controls if cookies are sent with cross-site requests: Strict (never cross-site), Lax (only top-level navigations), None (always send, but must have Secure).
  sameSite: crossSite ? "none" : "lax",
  // Only set domain if you KNOW you need it (e.g., ".example.com")
  // Otherwise omit to let the browser use the request host exactly.
  ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  path: "/",
});

// pick true if your app and API are on different origins (likely)
const CROSS_SITE = true;

const base = makeBase(CROSS_SITE);

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    ...base,
    maxAge: REFRESH_TOKEN_TTL_SEC * 1000, // e.g., 30d
  });
}

export function clearAuthCookies(res: Response) {
  // Clear with the SAME attributes used to set, or browsers won't delete
  res.clearCookie("accessToken", base);
  res.clearCookie(REFRESH_COOKIE, base);
}
