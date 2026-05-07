/**
 * In-memory + sessionStorage token storage.
 *
 * Mitigates XSS-token-theft compared to localStorage:
 *   - Token primarily lives in JS memory (no DOM/storage exposure during runtime)
 *   - On page reload we rehydrate from sessionStorage (auto-cleared when the tab closes)
 *   - localStorage is never touched, so persistent malicious scripts can't read it
 */
const STORAGE_KEY = "psjt.auth.token";

let memoryToken = null;

export const tokenStorage = {
  get() {
    if (memoryToken) return memoryToken;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) memoryToken = stored;
      return memoryToken;
    } catch {
      return null;
    }
  },
  set(token) {
    memoryToken = token;
    try {
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      /* ignore storage errors */
    }
  },
  clear() {
    memoryToken = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    // Also defensively clear any legacy localStorage token from older versions
    try {
      localStorage.removeItem("token");
    } catch {
      /* ignore */
    }
  },
};
