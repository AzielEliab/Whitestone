import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import { themeStorageKey } from "../../session/wipe";

export function ThemeToggle() {
  const [current, setCurrent] = useState<"light" | "dark">(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(themeStorageKey());
      } catch {
        /* ignore */
      }
      if (saved === "light" || saved === "dark") return;
      const mode = media.matches ? "dark" : "light";
      document.documentElement.dataset.theme = mode;
      setCurrent(mode);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  const apply = (mode: "light" | "dark") => {
    document.documentElement.dataset.theme = mode;
    setCurrent(mode);
    try {
      localStorage.setItem(themeStorageKey(), mode);
    } catch {
      /* ignore */
    }
  };
  return (
    <Buttonish
      aria-label="Toggle color theme"
      onClick={() => apply(current === "dark" ? "light" : "dark")}
    >
      {current === "dark" ? "Light" : "Dark"}
    </Buttonish>
  );
}

function Buttonish({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="btn" type="button" {...props}>
      {children}
    </button>
  );
}
