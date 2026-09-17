const SESSION_KEY = "whitestone.session.v1";
const THEME_KEY = "whitestone.theme";

const DB_NAMES = ["whitestone", "Whitestone", "whitestone-session"];

export function sessionStorageKey() {
  return SESSION_KEY;
}

export function themeStorageKey() {
  return THEME_KEY;
}

export async function wipeSessionArtifacts(opts?: { revokeUrls?: string[] }): Promise<void> {
  for (const url of opts?.revokeUrls ?? []) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }

  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.clear();
  } catch {
    /* ignore */
  }

  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }

  if (typeof indexedDB !== "undefined") {
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs
            .map((d) => d.name)
            .filter((name): name is string => !!name && /whitestone|pdfjs|tesseract/i.test(name))
            .map((name) => indexedDB.deleteDatabase(name)),
        );
      } else {
        await Promise.all(DB_NAMES.map((name) => indexedDB.deleteDatabase(name)));
      }
    } catch {
      try {
        await Promise.all(DB_NAMES.map((name) => indexedDB.deleteDatabase(name)));
      } catch {
        /* ignore */
      }
    }
  }

  if ("caches" in globalThis) {
    try {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => /whitestone|session|workbox/i.test(k))
          .map((k) => caches.delete(k)),
      );
    } catch {
      /* ignore */
    }
  }

  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }
}

export function persistSessionJson(json: string) {
  sessionStorage.setItem(SESSION_KEY, json);
}

export function readSessionJson(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
