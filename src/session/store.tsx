import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { advise, openingMessage } from "../engine/advisor";
import { routeIntent } from "../engine/intent";
import { mapEvidence } from "../engine/evidence-map";
import { asOfFromSession, looksHistorical } from "../history";
import { learnFromSession } from "../engine/learn";
import { probeResearch, requestResearch } from "../research/client";
import { mergeWebNotes } from "../research/format";
import { shouldFetch } from "../research/should-fetch";
import type { ResearchReason, ResearchResult } from "../research/types";
import {
  clearAreaSpecificState,
  hasAreaSpecificState,
  isPracticeArea,
  matterBelongsToArea,
} from "../practice/areas";
import { emptySession, type AppStep, type MatterType, type PracticeArea, type SessionState } from "../types";
import { persistSessionJson, readSessionJson, wipeSessionArtifacts } from "./wipe";

interface SessionApi {
  state: SessionState;
  setStep: (step: AppStep) => void;
  acceptDisclaimer: () => void;
  beginSession: (area: PracticeArea) => void;
  resetPracticeArea: () => void;
  setJurisdiction: (code: string) => void;
  setMatter: (matter: MatterType) => void;
  patch: (partial: Partial<SessionState>) => void;
  ask: (text: string) => void;
  answerQuestion: (id: string, value: string) => void;
  addUpload: (file: SessionState["uploads"][number]) => void;
  removeUpload: (id: string) => void;
  remapEvidence: () => void;
  seedAdvisor: () => void;
  setWebEnabled: (on: boolean) => void;
  setHistoricalMode: (on: boolean) => void;
  setCaseMode: (on: boolean) => void;
  setAsOf: (year: number | null, month: number | null) => void;
  clearWebNotes: () => void;
  refreshResearch: (query?: string, reason?: ResearchReason) => Promise<void>;
  erase: () => Promise<void>;
}

const Ctx = createContext<SessionApi | null>(null);

function hydrate(): SessionState {
  const raw = readSessionJson();
  if (!raw) return emptySession();
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (parsed?.version === 1) {
      const base = emptySession();
      const practiceArea = isPracticeArea(parsed.practiceArea)
        ? parsed.practiceArea
        : parsed.disclaimerAccepted
          ? "divorce"
          : null;
      const matter = parsed.matter && matterBelongsToArea(parsed.matter, practiceArea) ? parsed.matter : null;
      return {
        ...base,
        ...parsed,
        practiceArea,
        matter,
        learned: { ...base.learned, ...parsed.learned },
        webEnabled: parsed.webEnabled !== false,
        webNotes: Array.isArray(parsed.webNotes) ? parsed.webNotes : [],
        webStatus: parsed.webStatus ?? "idle",
        webMessage: parsed.webMessage ?? "",
        historicalMode: parsed.historicalMode === true,
        caseMode: parsed.caseMode === true,
        asOfYear: typeof parsed.asOfYear === "number" ? parsed.asOfYear : null,
        asOfMonth: typeof parsed.asOfMonth === "number" ? parsed.asOfMonth : null,
        uploads: Array.isArray(parsed.uploads)
          ? parsed.uploads.map((u) => ({
              ...u,
              kind: u.kind ?? "evidence",
              sourceDate: typeof u.sourceDate === "string" && u.sourceDate.trim() ? u.sourceDate : null,
            }))
          : [],
      };
    }
  } catch {
    /* ignore */
  }
  return emptySession();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(hydrate);
  const urls = useRef<string[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const researchReady = useRef<boolean | null>(null);

  useEffect(() => {
    const slim: SessionState = {
      ...state,
      uploads: state.uploads.map((u) => ({ ...u, previewUrl: undefined })),
    };
    persistSessionJson(JSON.stringify(slim));
  }, [state]);

  const patch = useCallback((partial: Partial<SessionState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const api = useMemo<SessionApi>(() => {
    return {
      state,
      setStep: (step) => setState((s) => ({ ...s, step })),
      acceptDisclaimer: () => setState((s) => ({ ...s, disclaimerAccepted: true, step: "welcome" })),
      beginSession: (area) => {
        setState((s) => {
          const switching = Boolean(s.practiceArea && s.practiceArea !== area && hasAreaSpecificState(s));
          if (switching) {
            for (const file of s.uploads) {
              if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
            }
          }
          const next = switching ? clearAreaSpecificState(s) : s;
          return {
            ...next,
            disclaimerAccepted: true,
            practiceArea: area,
            step: next.jurisdiction ? "matter" : "jurisdiction",
          };
        });
      },
      resetPracticeArea: () => {
        setState((s) => {
          for (const file of s.uploads) {
            if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
          }
          return {
            ...clearAreaSpecificState(s),
            practiceArea: null,
            disclaimerAccepted: true,
            step: "welcome",
          };
        });
      },
      setJurisdiction: (code) => setState((s) => ({ ...s, jurisdiction: code, step: "matter" })),
      setMatter: (matter) => {
        setState((s) => {
          if (!matterBelongsToArea(matter, s.practiceArea)) return s;
          return { ...s, matter, step: "facts" };
        });
      },
      patch,
      ask: (text) => {
        void (async () => {
          const user = {
            id: crypto.randomUUID(),
            role: "user" as const,
            text,
            at: new Date().toISOString(),
          };
          const base: SessionState = { ...stateRef.current, messages: [...stateRef.current.messages, user] };
          setState(base);
          try {
          const localEval = looksLikeLocalEvalAsk(text, base);
          const willFetch =
            base.webEnabled &&
            !localEval &&
            shouldFetch({
              query: text,
              jurisdiction: base.jurisdiction,
              matter: base.matter,
              practiceArea: base.practiceArea,
              reason: "ask",
            });
          setState({ ...base, webStatus: willFetch ? "loading" : base.webStatus });

          let research: ResearchResult | null = null;
          if (willFetch) {
            if (researchReady.current === null) researchReady.current = await probeResearch();
            research = researchReady.current
              ? await requestResearch({
                  jurisdiction: base.jurisdiction,
                  matter: base.matter,
                  practiceArea: base.practiceArea,
                  query: text,
                  reason: "ask",
                })
              : {
                  ok: false,
                  capability: "allowlisted-public-pages",
                  sources: [],
                  notes: "Live research is not on this copy.",
                  unavailable: true,
                  failed: [],
                  fetched: 0,
                  cached: 0,
                };
          }

            const { reply, state: next, followUps, grounding, receipt } = advise(base, text, research);
            const webNotes = research?.sources.length ? mergeWebNotes(next.webNotes, research.sources) : next.webNotes;
            const advisor = {
              id: crypto.randomUUID(),
              role: "advisor" as const,
              text: reply,
              at: new Date().toISOString(),
              sources: research?.sources,
              followUps,
              grounding: {
                verdict: grounding.verdict,
                confidenceCap: grounding.confidenceCap,
                flags: grounding.flags,
                evidence: grounding.evidence,
                motto: grounding.motto,
              },
              receipt: { sha256: receipt.sha256, sourceUrls: receipt.sourceUrls, statIds: receipt.statIds },
            };
            setState({
              ...next,
              messages: [...next.messages, advisor],
              webNotes,
              webStatus: !willFetch
                ? next.webStatus
                : research?.unavailable
                  ? "unavailable"
                  : research?.sources.length
                    ? "ok"
                    : research?.failed.length
                      ? "unavailable"
                      : next.webStatus,
              webMessage: research?.notes ?? next.webMessage,
            });
          } catch {
            setState((s) => ({
              ...s,
              messages: [
                ...s.messages,
                {
                  id: crypto.randomUUID(),
                  role: "advisor" as const,
                  text: "I could not finish that turn from the session engine. Ask again, or use End & erase. I will not invent a statute or holding to fill the gap.",
                  at: new Date().toISOString(),
                },
              ],
            }));
          }
        })();
      },
      answerQuestion: (id, value) => {
        setState((s) => {
          const answers = { ...s.answers, [id]: value };
          const interim = learnFromSession({ ...s, answers });
          return { ...s, answers, learned: interim };
        });
      },
      addUpload: (file) => {
        if (file.previewUrl) urls.current.push(file.previewUrl);
        setState((s) => {
          const uploads = [...s.uploads, file];
          return { ...s, uploads, mappings: mapEvidence(uploads, s.matter) };
        });
      },
      removeUpload: (id) => {
        setState((s) => {
          const gone = s.uploads.find((u) => u.id === id);
          if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
          const uploads = s.uploads.filter((u) => u.id !== id);
          return { ...s, uploads, mappings: mapEvidence(uploads, s.matter) };
        });
      },
      remapEvidence: () => {
        setState((s) => ({ ...s, mappings: mapEvidence(s.uploads, s.matter) }));
      },
      seedAdvisor: () => {
        setState((s) => {
          if (s.messages.some((m) => m.role === "advisor")) return { ...s, step: "advise" };
          const text = openingMessage(s);
          return {
            ...s,
            step: "advise",
            messages: [
              ...s.messages,
              { id: crypto.randomUUID(), role: "advisor", text, at: new Date().toISOString() },
            ],
          };
        });
      },
      setWebEnabled: (on) => {
        setState((s) => ({
          ...s,
          webEnabled: on,
          webStatus: on ? s.webStatus : "off",
        }));
      },
      setHistoricalMode: (on) => {
        setState((s) => ({
          ...s,
          historicalMode: on,
          asOfYear: on ? s.asOfYear : null,
          asOfMonth: on ? s.asOfMonth : null,
        }));
      },
      setCaseMode: (on) => {
        setState((s) => ({
          ...s,
          caseMode: on,
          historicalMode: on ? true : s.historicalMode,
        }));
      },
      setAsOf: (year, month) => {
        setState((s) => ({
          ...s,
          historicalMode: year != null && month != null ? true : s.historicalMode,
          asOfYear: year,
          asOfMonth: month,
        }));
      },
      clearWebNotes: () => {
        setState((s) => ({
          ...s,
          webNotes: [],
          webStatus: s.webEnabled ? "idle" : "off",
          webMessage: "",
        }));
      },
      refreshResearch: async (query?: string, reason: ResearchReason = "manual") => {
        const snap = stateRef.current;
        if (!snap.webEnabled) return;
        const q = (query ?? "official self-help clerk packet forms").trim();
        if (
          !shouldFetch({
            query: q,
            jurisdiction: snap.jurisdiction,
            matter: snap.matter,
            practiceArea: snap.practiceArea,
            reason,
          })
        ) {
          return;
        }
        setState((s) => ({ ...s, webStatus: "loading" }));
        if (researchReady.current === null) researchReady.current = await probeResearch();
        const research = researchReady.current
          ? await requestResearch({
              jurisdiction: snap.jurisdiction,
              matter: snap.matter,
              practiceArea: snap.practiceArea,
              query: q,
              reason,
            })
          : ({
              ok: false,
              capability: "allowlisted-public-pages",
              sources: [],
              notes: "Live research is not on this copy.",
              unavailable: true,
              failed: [],
              fetched: 0,
              cached: 0,
            } satisfies ResearchResult);
        setState((s) => ({
          ...s,
          webNotes: research.sources.length ? mergeWebNotes(s.webNotes, research.sources) : s.webNotes,
          webStatus: research.unavailable ? "unavailable" : research.sources.length ? "ok" : "unavailable",
          webMessage: research.notes,
        }));
      },
      erase: async () => {
        await wipeSessionArtifacts({ revokeUrls: urls.current });
        urls.current = [];
        researchReady.current = null;
        setState(emptySession());
      },
    };
  }, [patch, state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession outside provider");
  return ctx;
}

function looksLikeLocalEvalAsk(text: string, state: SessionState): boolean {
  const intent = routeIntent(text, state);
  if (looksHistorical(text) || intent === "historical" || intent === "honesty" || intent === "casemode") return true;
  return Boolean(state.historicalMode && asOfFromSession(state.asOfYear, state.asOfMonth));
}
