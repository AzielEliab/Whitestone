export function SoftwareDownload({ className = "btn" }: { className?: string }) {
  const hosted =
    typeof window !== "undefined" &&
    (window.location.hostname.endsWith("workers.dev") || window.location.hostname.endsWith("azieleliab.com"));
  const href = hosted
    ? "/download"
    : "https://github.com/AzielEliab/Whitestone/releases/latest";
  return (
    <a className={className} href={href} rel="noreferrer">
      Download software
    </a>
  );
}
