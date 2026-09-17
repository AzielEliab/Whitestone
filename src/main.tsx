import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SessionProvider } from "./session/store";
import { themeStorageKey } from "./session/wipe";
import "./styles.css";

try {
  const saved = localStorage.getItem(themeStorageKey());
  if (saved === "dark" || saved === "light") {
    document.documentElement.dataset.theme = saved;
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
  }
} catch {
  /* ignore */
}

fetch(new URL("count/view", window.location.href), { cache: "no-store" }).catch(() => undefined);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>,
);
