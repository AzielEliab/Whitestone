/** Shared tokenize / Jaccard used by AZ-CLCE and SPRE ports. Author: Aziel Eliab. */

export const MAX_FIELD_CHARS = 64 * 1024;

export function checkField(name: string, value: unknown): string {
  const text = value == null ? "" : String(value);
  if (text.length > MAX_FIELD_CHARS) {
    throw new Error(`${name} exceeds size limit (${text.length} > ${MAX_FIELD_CHARS} characters)`);
  }
  return text;
}

export function tokenize(text: unknown): Set<string> {
  if (text == null) return new Set();
  const src = typeof text === "string" ? text : Array.isArray(text) ? text.join(" ") : String(text);
  const out = new Set<string>();
  for (const tok of src.toLowerCase().split(/[^a-z0-9]+/)) {
    if (tok) out.add(tok);
  }
  return out;
}

export function jaccard(...groups: Array<Iterable<string> | Set<string>>): number {
  const sets = groups.map((g) => (g instanceof Set ? g : new Set(g || [])));
  if (!sets.some((s) => s.size)) return 1;
  const union = new Set<string>();
  for (const s of sets) for (const x of s) union.add(x);
  if (!union.size) return 1;
  let inter = new Set(sets[0]);
  for (const s of sets.slice(1)) {
    inter = new Set([...inter].filter((x) => s.has(x)));
  }
  return inter.size / union.size;
}

export function clip01(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const n = Number(value);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function clip(value: number): number {
  return clip01(value) ?? 0;
}

export function score100(value: number | null | undefined): number | null {
  const unit = clip01(value);
  if (unit == null) return null;
  return Number((unit * 100).toFixed(4));
}

export function join(parts: Iterable<string | undefined | null>): string {
  return [...parts].filter((p) => p && String(p).trim()).join(" ");
}

export function hasPhrase(text: string, phrases: readonly string[]): boolean {
  const blob = String(text || "").toLowerCase();
  return phrases.some((p) => blob.includes(p));
}

export function tokenHits(text: string, wanted: ReadonlySet<string>): number {
  let n = 0;
  for (const tok of tokenize(text)) if (wanted.has(tok)) n += 1;
  return n;
}

export function asList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter((v) => v != null && String(v).trim()).map(String);
  const text = String(value).trim();
  return text ? [text] : [];
}
