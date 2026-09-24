import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyHostSurface, NARROW_QUERY } from "./host";
import { registerShellWorker } from "./pwa";
import { SessionProvider } from "./session/store";
import { themeStorageKey } from "./session/wipe";
import "./styles.css";

function applyThemeFromPreference() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(themeStorageKey());
  } catch {
    /* ignore */
  }
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = saved === "dark" || saved === "light" ? saved : systemDark ? "dark" : "light";
  document.documentElement.dataset.theme = mode;
}

try {
  applyThemeFromPreference();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyThemeFromPreference);
} catch {
  /* ignore */
}

applyHostSurface();
try {
  window.matchMedia(NARROW_QUERY).addEventListener("change", () => applyHostSurface());
} catch {
  /* ignore */
}

registerShellWorker();

fetch(new URL("count/view", window.location.href), { cache: "no-store" }).catch(() => undefined);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
);
