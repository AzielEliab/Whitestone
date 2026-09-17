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
import { mapEvidence } from "../engine/evidence-map";
import { learnFromSession } from "../engine/learn";
import { emptySession, type AppStep, type MatterType, type SessionState } from "../types";
import { persistSessionJson, readSessionJson, wipeSessionArtifacts } from "./wipe";

interface SessionApi {
  state: SessionState;
  setStep: (step: AppStep) => void;
  acceptDisclaimer: () => void;
  setJurisdiction: (code: string) => void;
  setMatter: (matter: MatterType) => void;
  patch: (partial: Partial<SessionState>) => void;
  ask: (text: string) => void;
  answerQuestion: (id: string, value: string) => void;
  addUpload: (file: SessionState["uploads"][number]) => void;
  removeUpload: (id: string) => void;
  remapEvidence: () => void;
  seedAdvisor: () => void;
  erase: () => Promise<void>;
}

const Ctx = createContext<SessionApi | null>(null);

function hydrate(): SessionState {
  const raw = readSessionJson();
  if (!raw) return emptySession();
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (parsed?.version === 1) return parsed;
  } catch {
    /* ignore */
  }
  return emptySession();
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(hydrate);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const slim: SessionState = {
      ...state,
      uploads: state.uploads.map((u) => ({ ...u, previewUrl: undefined })),
    };
    persistSessionJson(JSON.stringify(slim));
  }, [state]);

  useEffect(() => {
    const flush = () => {
      void wipeSessionArtifacts({ revokeUrls: urls.current });
    };
    const onHide = () => {
      if (document.visibilityState === "hidden" && !state.disclaimerAccepted) {
        return;
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [state.disclaimerAccepted]);

  const patch = useCallback((partial: Partial<SessionState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const api = useMemo<SessionApi>(() => {
    return {
      state,
      setStep: (step) => setState((s) => ({ ...s, step })),
      acceptDisclaimer: () => setState((s) => ({ ...s, disclaimerAccepted: true, step: "jurisdiction" })),
      setJurisdiction: (code) => setState((s) => ({ ...s, jurisdiction: code, step: "matter" })),
      setMatter: (matter) => setState((s) => ({ ...s, matter, step: "facts" })),
      patch,
      ask: (text) => {
        setState((s) => {
          const user = {
            id: crypto.randomUUID(),
            role: "user" as const,
            text,
            at: new Date().toISOString(),
          };
          const { reply, state: next } = advise({ ...s, messages: [...s.messages, user] }, text);
          const advisor = {
            id: crypto.randomUUID(),
            role: "advisor" as const,
            text: reply,
            at: new Date().toISOString(),
          };
          return { ...next, messages: [...next.messages, advisor] };
        });
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
      erase: async () => {
        await wipeSessionArtifacts({ revokeUrls: urls.current });
        urls.current = [];
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
