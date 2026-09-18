import { MAX_SESSION_SOURCES, type ResearchResult, type WebSource } from "./types";

export function retrievedDay(iso: string): string {
  return iso.slice(0, 10) || iso;
}

export function formatWebNotes(result: Pick<ResearchResult, "sources" | "notes">): string {
  const lines = [
    "From the web (this session only) — public allowlisted pages. Not legal advice. Not a complete statute book. I do not invent citations.",
  ];
  if (result.notes) lines.push(result.notes);
  result.sources.forEach((source, i) => {
    lines.push(
      `${i + 1}. ${source.title} (${source.label})\n   “${source.excerpt}”\n   ${source.url} · retrieved ${retrievedDay(source.retrievedAt)}`,
    );
  });
  const takeaways = webTakeaways(result);
  if (takeaways) lines.push(takeaways);
  return lines.join("\n\n");
}

export function webTakeaways(result: Pick<ResearchResult, "sources">): string {
  if (!result.sources.length) return "";
  const bits = result.sources.slice(0, 3).map((source, i) => {
    const excerpt = source.excerpt.replace(/\s+/g, " ").trim().slice(0, 220);
    return `Takeaway ${i + 1}: ${excerpt} — ${source.title} (${source.url}, retrieved ${retrievedDay(source.retrievedAt)}).`;
  });
  return ["Concrete takeaways from those pages (still verify with the clerk):", ...bits].join("\n");
}

export function mergeWebNotes(existing: WebSource[], incoming: WebSource[]): WebSource[] {
  const map = new Map<string, WebSource>();
  for (const source of existing) map.set(source.url.replace(/\/+$/, ""), source);
  for (const source of incoming) map.set(source.url.replace(/\/+$/, ""), source);
  return [...map.values()].slice(-MAX_SESSION_SOURCES);
}

export function fallbackResearchNote(result: ResearchResult): string | null {
  if (result.sources.length) return null;
  if (result.unavailable) {
    return "A live page lookup is not available in this copy (offline zip or local Vite without the Worker). I am using the bundled jurisdiction notes.";
  }
  if (result.failed.length) {
    const sample = result.failed
      .slice(0, 2)
      .map((f) => f.url)
      .join("; ");
    return `A live page lookup did not complete (${result.failed.length} allowlisted fetch(es) failed${sample ? `: ${sample}` : ""}). I am using the bundled knowledge layer. I will not invent citations to fill the gap.`;
  }
  return null;
}
