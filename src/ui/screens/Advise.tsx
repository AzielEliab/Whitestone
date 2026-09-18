import { useEffect, useRef, useState } from "react";
import { nextQuestion, starterPrompts } from "../../engine/dialogue";
import { defaultResearchQuery } from "../../practice/areas";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { SourceChips, WebSources } from "../components/WebSources";

export function Advise() {
  const { state, ask, answerQuestion, setStep, setWebEnabled, clearWebNotes, refreshResearch } =
    useSession();
  const [draft, setDraft] = useState("");
  const q = nextQuestion(state);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !state.webEnabled || !state.jurisdiction || state.webNotes.length) return;
    seeded.current = true;
    void refreshResearch(defaultResearchQuery(state.practiceArea), "filing");
  }, [state.webEnabled, state.jurisdiction, state.practiceArea, state.webNotes.length, refreshResearch]);

  return (
    <div className="grid two advise-layout">
      <section className="card advise-card">
        <h2>Guided advisor</h2>
        <p className="muted">
          Answers steer this session only. The engine retrieves checklists and
          jurisdiction notes first. The hosted app may add allowlisted public
          pages. It does not call an external model.
        </p>
        <div className="chat" aria-live="polite">
          {state.messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.text}
              <SourceChips sources={m.sources} />
            </div>
          ))}
        </div>
        <form
          className="grid advise-composer"
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            ask(t);
            setDraft("");
          }}
        >
          <div className="field">
            <label htmlFor="ask">Your question or facts</label>
            <textarea
              id="ask"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about venue, packets, court process, safety…"
              enterKeyHint="send"
              autoComplete="off"
            />
          </div>
          <Button kind="primary" type="submit">
            Ask in this session
          </Button>
        </form>
        <div className="chips starter-chips">
          {starterPrompts(state.matter).map((p) => (
            <button key={p} type="button" className="chip" onClick={() => ask(p)}>
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
          <Button kind="primary" onClick={() => setStep("filing")}>
            Open filing structure
          </Button>
          <Button onClick={() => setStep("evidence")}>Back</Button>
        </div>
        {state.learned.safetyFlag && (
          <p className="warn">
            Safety flag is on for this session. 911 · 1-800-799-7233 · 988
          </p>
        )}
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
