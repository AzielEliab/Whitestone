/** Register a shell-only service worker. It must never store case content. */
export function registerShellWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  const register = () => {
    const url = new URL("sw.js", document.baseURI);
    const scope = new URL("./", document.baseURI).pathname;
    navigator.serviceWorker.register(url, { scope }).catch(() => undefined);
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
