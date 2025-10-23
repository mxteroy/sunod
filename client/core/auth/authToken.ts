// authToken.ts
const KEY = "accessToken";

export const authToken = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(tok: string | null) {
    try {
      if (tok) localStorage.setItem(KEY, tok);
      else localStorage.removeItem(KEY);
    } catch {}
  },
};
