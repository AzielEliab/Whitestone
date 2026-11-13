import { useEffect, useRef, type ReactNode } from "react";

/** Collapsed power-user and notes section. Opens itself when a mode inside is already on. */
export function Advanced({
  children,
  title = "Advanced",
  startOpen = false,
}: {
  children: ReactNode;
  title?: string;
  startOpen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (startOpen && ref.current) ref.current.open = true;
  }, [startOpen]);
  return (
    <details className="advanced" ref={ref}>
      <summary>{title}</summary>
      <div className="advanced-body">{children}</div>
    </details>
  );
}
