import type { HonestyEvaluation, LabeledScore } from "./evaluate";

function scoreLine(name: string, s: LabeledScore): string {
  if (s.status === "UNKNOWN" || s.value == null) return `${name}: UNKNOWN. ${s.note}`;
  return `${name}: ${(s.value * 100).toFixed(1)} (LABELED, not truth). ${s.note}`;
}

export function formatHonestyBlock(evaln: HonestyEvaluation): string {
  const parts = [
    "Anti-corruption / honesty evaluation (session-only, labeled scores).",
    evaln.disclaimer,
    evaln.nolie,
    evaln.limitation,
    scoreLine("truth_buried", evaln.truth_buried),
    scoreLine("truth_overcame_lie", evaln.truth_overcame_lie),
    scoreLine("honesty_overall", evaln.honesty_overall),
  ];

  const clce = evaln.engines.clce;
  parts.push(
    `AZ-CLCE (R/D/P Jaccard, ${clce.spec}): triple ${clce.triple.toFixed(3)} · band ${clce.band} · types ${
      clce.types.length ? clce.types.join(",") : "none"
    }. ${clce.limitation}`,
  );
  const spre = evaln.engines.spre;
  parts.push(`SPRE (${spre.spec}): PC ${spre.pc.toFixed(3)} · SSI ${spre.ssi.toFixed(3)} · ${spre.plain}`);
  const phy = evaln.engines.physling;
  parts.push(
    `PhysLing (${phy.home}): ${phy.verified ? `score ${phy.score?.toFixed(3)}` : "UNVERIFIED / UNKNOWN"}. ${phy.note}`,
  );
  const triad = evaln.engines.triad;
  parts.push(
    `Triad ${triad.schema}: final ${
      triad.final.ready && triad.final.score != null ? triad.final.score.toFixed(3) : "null (not all three verified)"
    }. ${triad.final.note}`,
  );
  const ts = evaln.engines.triadscore;
  parts.push(
    `Triadscore (${ts.spec}): 3-of-4 ${ts.triad_ok ? "met" : "not met"} (${ts.decided} decided). Posterior ${
      ts.posterior_mean == null ? "UNKNOWN" : ts.posterior_mean.toFixed(3)
    } — belief, not truth.`,
  );
  const z = evaln.engines.zion;
  parts.push(
    `ZionPattern (${z.spec}): display ${z.display}/75 (hard cap). official_contradiction ${z.official_contradiction.toFixed(2)} · Does not solve a case.`,
  );
  const lat = evaln.engines.lattice;
  parts.push(
    `Hashchain lattice (${lat.spec}): ${lat.nodes.length} session node(s), tip ${lat.tip ?? "none"}. ${
      lat.matches.length
        ? lat.matches
            .slice(0, 4)
            .map((m) => `${m.nodeId} ↔ ${m.pinId} ${m.label} ${m.similarity.toFixed(2)} (${m.sources.join("; ")})`)
            .join(" · ")
        : "No similar-event match above the quiet line."
    } ${lat.limitation}`,
  );

  if (evaln.evidence.length) {
    parts.push(
      `Evidence list:\n${evaln.evidence
        .slice(0, 8)
        .map((e, i) => `${i + 1}. [${e.kind}${e.date ? ` · ${e.date}` : ""}] ${e.label} — ${e.source}. ${e.excerpt}`)
        .join("\n")}`,
    );
  } else {
    parts.push("Evidence list: none in this session. UNKNOWN.");
  }

  parts.push(`Cites: ${evaln.cites.join(" · ")}`);
  return parts.join("\n\n");
}
