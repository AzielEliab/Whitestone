/**
 * Ephemeral hashchain lattice — session materials vs bundled pattern pins.
 * Cite (design only): ChainLock CL-WP-0.4 / hashchain — Whitestone does not
 * embed durable Worker memory or LOCKSET. Wipe with End & erase.
 * Similar events only with labeled similarity + sources.
 * Author: Aziel Eliab. Apache-2.0.
 */
import { sha256Hex } from "../guard/hash";
import { TRAINING_CASES } from "./spre";
import { jaccard, tokenize } from "./tokens";
import { ZION_PATTERNS } from "./zion";

export const LATTICE_SPEC = "CL-WP-0.4 cite-only (ephemeral session lattice)";
export const LATTICE_LIMITATION =
  "Content hashes of this session's materials compared to prior in-session nodes and bundled pattern pins. Ephemeral. Not durable ChainLock / LOCKSET. Not Worker memory. Wipe with End & erase. Similarity is labeled, not identification.";

export interface LatticeNode {
  id: string;
  kind: string;
  label: string;
  sha256: string;
  prev: string | null;
  sourceDate: string | null;
  source: string;
}

export interface LatticeMatch {
  nodeId: string;
  pinId: string;
  similarity: number;
  label: "identical-hash" | "similar-tokens" | "weak";
  sources: string[];
  note: string;
}

export interface LatticeReport {
  schema: "whitestone.lattice.v1";
  spec: string;
  tip: string | null;
  nodes: LatticeNode[];
  pins: { id: string; sha256: string; label: string; source: string }[];
  matches: LatticeMatch[];
  limitation: string;
  durable_worker_memory: false;
}

export interface LatticeMaterial {
  id: string;
  kind: string;
  label: string;
  text: string;
  sourceDate?: string | null;
  source?: string;
}

function pinPayload(id: string, text: string): { id: string; sha256: string; label: string; source: string } {
  return {
    id,
    sha256: sha256Hex(text),
    label: id,
    source: "bundled-pin",
  };
}

export function bundledPins(): { id: string; sha256: string; label: string; source: string }[] {
  const pins = TRAINING_CASES.map((c) =>
    pinPayload(
      `spre:${c.id}`,
      JSON.stringify({
        id: c.id,
        official: c.official,
        internal: c.internal,
        physics: c.physics,
        note: c.note,
      }),
    ),
  );
  for (const p of ZION_PATTERNS) {
    pins.push(pinPayload(`zion:${p.id}`, `${p.id}|${p.name}|${p.heuristic}|${p.cues.join(",")}`));
  }
  return pins;
}

export function buildLattice(materials: LatticeMaterial[]): LatticeReport {
  const pins = bundledPins();
  const nodes: LatticeNode[] = [];
  let prev: string | null = null;
  for (const m of materials) {
    const sha256 = sha256Hex(m.text.trim());
    const node: LatticeNode = {
      id: m.id,
      kind: m.kind,
      label: m.label,
      sha256,
      prev,
      sourceDate: m.sourceDate ?? null,
      source: m.source ?? "session",
    };
    nodes.push(node);
    prev = sha256;
  }

  const matches: LatticeMatch[] = [];
  for (const node of nodes) {
    const material = materials.find((x) => x.id === node.id);
    const tokens = tokenize(material?.text ?? "");
    for (const pin of pins) {
      if (node.sha256 === pin.sha256) {
        matches.push({
          nodeId: node.id,
          pinId: pin.id,
          similarity: 1,
          label: "identical-hash",
          sources: [node.source, pin.source],
          note: "Exact content hash match to a bundled pin. Shape identity, not a new-case identification.",
        });
        continue;
      }
      const pinTok = tokenize(pin.label + " " + pin.id);
      const sim = tokens.size && pinTok.size ? jaccard(tokens, pinTok) : 0;
      if (sim >= 0.35) {
        matches.push({
          nodeId: node.id,
          pinId: pin.id,
          similarity: Number(sim.toFixed(4)),
          label: sim >= 0.6 ? "similar-tokens" : "weak",
          sources: [node.source, pin.source, ...(node.sourceDate ? [`dated:${node.sourceDate}`] : [])],
          note: `Labeled token similarity ${sim.toFixed(2)} to pin ${pin.id}. Not “this is that event.”`,
        });
      }
    }
    for (const other of nodes) {
      if (other.id === node.id) continue;
      if (other.sha256 === node.sha256) {
        matches.push({
          nodeId: node.id,
          pinId: `session:${other.id}`,
          similarity: 1,
          label: "identical-hash",
          sources: [node.source, other.source],
          note: "Identical content hash to another in-session material.",
        });
      }
    }
  }

  const unique = new Map<string, LatticeMatch>();
  for (const m of matches) {
    const key = `${m.nodeId}|${m.pinId}|${m.label}`;
    const prevM = unique.get(key);
    if (!prevM || m.similarity > prevM.similarity) unique.set(key, m);
  }

  return {
    schema: "whitestone.lattice.v1",
    spec: LATTICE_SPEC,
    tip: nodes.length ? nodes[nodes.length - 1].sha256 : null,
    nodes,
    pins,
    matches: [...unique.values()].sort((a, b) => b.similarity - a.similarity).slice(0, 12),
    limitation: LATTICE_LIMITATION,
    durable_worker_memory: false,
  };
}
