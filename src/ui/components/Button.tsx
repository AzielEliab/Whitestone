import type { ButtonHTMLAttributes } from "react";

export function Button({
  kind = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "default" | "primary" | "danger" }) {
  return <button {...props} className={`btn ${kind} ${props.className ?? ""}`} />;
}
