import { useEffect, useRef, useState } from "react";
import { starterPrompts } from "../../engine/dialogue";
import { defaultResearchQuery } from "../../practice/areas";
import { useSession } from "../../session/store";
import { Advanced } from "../components/Advanced";
import { Button } from "../components/Button";
import { GroundingBadge } from "../components/GroundingBadge";
import { HistoryPanel } from "../components/HistoryPanel";
import { CaseModePanel } from "../components/CaseModePanel";
import { HonestyPanel } from "../components/HonestyPanel";
import { MathPanel } from "../components/MathPanel";
import { StatsPanel } from "../components/StatsPanel";
import { SourceChips, WebSources } from "../components/WebSources";
import { WhatsNext } from "../components/WhatsNext";
import { nextQuestion } from "../../engine/dialogue";

export function Advise() {
  const { state, ask, answerQuestion, setStep, setWebEnabled, clearWebNotes, refreshResearch, seedAdvisor } =
    useSession();
  const [draft, setDraft] = useState("");
  const [tool, setTool] = useState<"none" | "math" | "stats" | "history" | "honesty" | "casemode">("none");
  const q = nextQuestion(state);
  const seeded = useRef(false);
  const opened = useRef(false);
  const lastAdvisor = [...state.messages].reverse().find((m) => m.role === "advisor");
  const followUps = lastAdvisor?.followUps?.length ? lastAdvisor.followUps : starterPrompts(state);

  useEffect(() => {
    if (opened.current || state.messages.some((m) => m.role === "advisor")) return;
    opened.current = true;
    seedAdvisor();
  }, [seedAdvisor, state.messages]);

  useEffect(() => {
    if (seeded.current || !state.webEnabled || !state.jurisdiction || state.webNotes.length) return;
    seeded.current = true;
    void refreshResearch(defaultResearchQuery(state.practiceArea), "filing");
  }, [state.webEnabled, state.jurisdiction, state.practiceArea, state.webNotes.length, refreshResearch]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    ask(t);
    setDraft("");
  }

  return (
    <div className="grid two advise-layout">
      <section className="card advise-card">
        <h2>Guided advisor</h2>
        <WhatsNext />
        <p className="muted">
          Answers steer this session only. The engine retrieves checklists and
          names your parties and facts. Grounding is an AZCoherence-inspired last
          pass. It does not call an external model.
        </p>
        <div className="chat" aria-live="polite">
          {state.messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.text}
              <SourceChips sources={m.sources} />
              <GroundingBadge message={m} />
            </div>
          ))}
        </div>
        <form
          className="grid advise-composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <Advanced startOpen={tool !== "none"}>
            <div className="advise-toolbar">
              <button type="button" className="chip" aria-pressed={tool === "math"} onClick={() => setTool(tool === "math" ? "none" : "math")}>
                Math
              </button>
              <button type="button" className="chip" aria-pressed={tool === "stats"} onClick={() => setTool(tool === "stats" ? "none" : "stats")}>
                Statistics
              </button>
              <button type="button" className="chip" aria-pressed={tool === "history"} onClick={() => setTool(tool === "history" ? "none" : "history")}>
                Historical as-of
              </button>
              <button type="button" className="chip" aria-pressed={tool === "honesty"} onClick={() => setTool(tool === "honesty" ? "none" : "honesty")}>
                Honesty eval
              </button>
              <button type="button" className="chip" aria-pressed={tool === "casemode"} onClick={() => setTool(tool === "casemode" ? "none" : "casemode")}>
                Case Mode
              </button>
            </div>
            {tool === "math" && <MathPanel onInsert={send} />}
            {tool === "stats" && <StatsPanel onInsert={send} />}
            {tool === "history" && <HistoryPanel onInsert={send} />}
            {tool === "honesty" && <HonestyPanel onInsert={send} />}
            {tool === "casemode" && <CaseModePanel onInsert={send} />}
          </Advanced>
          <div className="field">
            <label htmlFor="ask">Your question or facts</label>
            <textarea
              id="ask"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about venue, packets, as-of 1925-06, 10% of bail, what the numbers say…"
              enterKeyHint="send"
              autoComplete="off"
            />
          </div>
          <Button kind="primary" type="submit">
            Ask in this session
          </Button>
        </form>
        <div className="chips starter-chips">
          {followUps.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>
      </section>
      <aside className="card">
        <h3>Structured questions</h3>
        {q ? (
          <div className="grid">
            <p>
              <strong>{q.prompt}</strong>
            </p>
            <p className="muted">{q.why}</p>
            {q.options ? (
              <div className="chips">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="chip"
                    onClick={() => {
                      answerQuestion(q.id, opt);
                      ask(opt);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <QuestionText
                onSubmit={(v) => {
                  answerQuestion(q.id, v);
                  ask(v);
                }}
              />
            )}
          </div>
        ) : (
          <p>Structured questions for this matter are complete.</p>
        )}
        <div className="chips sticky-actions">
          <Button onClick={() => setStep("filing")}>Open filing structure</Button>
          <Button onClick={() => setStep("evidence")}>Back</Button>
        </div>
        {state.learned.safetyFlag && (
          <p className="warn">
            Safety flag is on for this session. 911 · 1-800-799-7233 · 988
          </p>
        )}
        <Advanced title="Web sources">
          <WebSources
            sources={state.webNotes}
            status={state.webStatus}
            message={state.webMessage}
            enabled={state.webEnabled}
            onToggle={setWebEnabled}
            onClear={clearWebNotes}
            onRefresh={() => {
              void refreshResearch(defaultResearchQuery(state.practiceArea), "manual");
            }}
          />
        </Advanced>
      </aside>
    </div>
  );
}

function QuestionText({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.trim()) return;
        onSubmit(v.trim());
        setV("");
      }}
    >
      <div className="field">
        <label htmlFor="q-free">Your answer</label>
        <input
          id="q-free"
          value={v}
          onChange={(e) => setV(e.target.value)}
          autoComplete="off"
          enterKeyHint="done"
        />
      </div>
      <Button type="submit">Save answer</Button>
    </form>
  );
}
