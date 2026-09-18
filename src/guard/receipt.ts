import { sha256Hex } from "./hash";

export interface SessionReceipt {
  sha256: string;
  sourceUrls: string[];
  statIds: string[];
  note: string;
}

export function sessionReceipt(reply: string, sourceUrls: string[], statIds: string[]): SessionReceipt {
  const urls = [...new Set(sourceUrls.filter(Boolean))].sort();
  const ids = [...new Set(statIds.filter(Boolean))].sort();
  const material = [reply.trim(), ...urls, ...ids].join("\n");
  return {
    sha256: sha256Hex(material),
    sourceUrls: urls,
    statIds: ids,
    note: "Ephemeral session receipt — wiped with End & erase. Not durable ChainLock / LOCKSET.",
  };
}
