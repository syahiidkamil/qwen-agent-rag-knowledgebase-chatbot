// ============================================================
// Airanext Camp — Chatbot widget (self-mounting)
// Renders to <div id="chatbot-root"></div>. Reads from AiraStore.
// ============================================================

(function () {
  const { useState, useEffect, useRef, useCallback } = React;

  function fakeReply(question, files) {
    const ingested = files.filter(f => f.status === "ingested");
    const pool = ingested.length ? ingested : files;
    const q = (question || "").toLowerCase();

    // pick 2-3 likely sources
    let matches = pool.filter(f => {
      const n = f.name.toLowerCase();
      return q.split(/\s+/).some(w => w.length > 3 && n.includes(w.slice(0, 5)));
    });
    if (matches.length < 2) {
      matches = [...matches, ...pool.filter(f => !matches.includes(f))].slice(0, Math.min(3, pool.length));
    }
    const sources = matches.slice(0, 3);

    const templates = {
      ai:        "The AI Engineering track is 16 weeks, project-based, and mentor-led. You'll build a production RAG system with an eval harness, ship agentic workflows, and complete a capstone with one of our 47 hiring partners. Prerequisites: comfortable in Python + at least one shipped backend project.",
      cohort:    "Cohort 14 opens applications now and starts September 22, 2026. The format is hybrid — twice-weekly in-person at our Jakarta studio plus async work. Tuition is Rp 48M, and we offer ISAs (pay 12% of salary for 18 months once you're hired above the Rp 8M/month floor).",
      schol:     "We award two kinds of scholarships: a 50% merit scholarship (8 seats per cohort, awarded by panel review) and a 100% diversity scholarship (4 seats per cohort, for under-represented groups in SEA tech). The next deadline is July 30.",
      partner:   "We currently work with 47 hiring partners across SEA — including fintech, healthtech, and AI-native startups. Cohort 13 placed 92% of graduates within 90 days at companies like Xendit, Halodoc, Ruangguru, and several Y Combinator-backed teams.",
      refund:    "Full refund within 7 days of cohort start, no questions asked. Pro-rated refund through week 4. After week 4, you can defer to a future cohort at no cost up to 12 months out.",
      tuition:   "Tuition is Rp 48M total. Three payment paths: (1) full upfront with 8% discount, (2) split into 4 installments over the program, (3) ISA — Rp 4M deposit, then 12% of salary for 18 months after you're hired above the floor.",
      curriculum:"The curriculum runs in 4 phases: Foundations (weeks 1-4), Build (weeks 5-9), Specialize (weeks 10-13), and Capstone (weeks 14-16). Each week has 2 mentor sessions, 1 demo day, and a paired project.",
      default:   "Based on the documents I have indexed, the most relevant sources are below. Want me to pull a specific section, or compare two options side by side?",
    };

    let body = templates.default;
    if (/(ai engineer|ai track|engineering track)/.test(q)) body = templates.ai;
    else if (/(cohort|start|when|date|begin|intake)/.test(q)) body = templates.cohort;
    else if (/(scholar|aid|discount|free|sponsor)/.test(q)) body = templates.schol;
    else if (/(partner|hire|hiring|employer|company|placement|placed)/.test(q)) body = templates.partner;
    else if (/(refund|defer|cancel|drop)/.test(q)) body = templates.refund;
    else if (/(tuition|cost|price|pay|fee|isa)/.test(q)) body = templates.tuition;
    else if (/(curriculum|syllabus|week|module|topic)/.test(q)) body = templates.curriculum;

    return { body, sources };
  }

  function Icon({ name, size = 16 }) {
    const c = "currentColor";
    const common = { width: size, height: size, viewBox: "0 0 20 20", fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
    if (name === "send")  return React.createElement("svg", common, React.createElement("path", { d: "M3 17l14-7L3 3l3 7-3 7zM6 10h11" }));
    if (name === "close") return React.createElement("svg", common, React.createElement("path", { d: "M5 5l10 10M15 5L5 15" }));
    return null;
  }

  function Chatbot({ embedded = false, onClose }) {
    const [config, setConfig] = useState(AiraStore.getConfig());
    const [files,  setFiles]  = useState(AiraStore.getFiles());
    useEffect(() => AiraStore.subscribe(() => {
      setConfig(AiraStore.getConfig());
      setFiles(AiraStore.getFiles());
    }), []);

    const w = config.widget;
    const [messages, setMessages] = useState([{ id: "m0", role: "bot", text: w.welcome }]);
    const [draft, setDraft] = useState("");
    const [typing, setTyping] = useState(false);
    const bodyRef = useRef(null);

    // refresh welcome if w changes and no convo yet
    useEffect(() => {
      setMessages(m => (m.length === 1 && m[0].id === "m0") ? [{ id: "m0", role: "bot", text: w.welcome }] : m);
    }, [w.welcome]);

    useEffect(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, typing]);

    const send = useCallback((text) => {
      const content = (text ?? draft).trim();
      if (!content) return;
      setDraft("");
      setMessages(m => [...m, { id: "u" + Date.now(), role: "user", text: content }]);
      setTyping(true);
      setTimeout(() => {
        const { body, sources } = fakeReply(content, files);
        setTyping(false);
        setMessages(m => [...m, { id: "b" + Date.now(), role: "bot", text: body, sources }]);
      }, 700 + Math.random() * 800);
    }, [draft, files]);

    const onKey = (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const showSuggestions = messages.length === 1 && !typing;
    const indexedCount = files.filter(f => f.status === "ingested").length;

    return (
      <div className={`chat-panel ${embedded ? "embedded" : ""}`}>
        <div className="chat-head">
          <div className="chat-avatar">{w.initial || (w.name || "A")[0]}</div>
          <div className="chat-head-text">
            <div className="chat-name">{w.name}</div>
            <div className="chat-status">grounded · {indexedCount} sources indexed</div>
          </div>
          {!embedded && onClose && (
            <button className="chat-head-close" onClick={onClose} aria-label="Close">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.map(m => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="msg-cite">
                  {m.sources.map((s, i) => (
                    <span className="cite" key={s.id}>
                      <span className="ix">[{i + 1}]</span> {s.name.length > 28 ? s.name.slice(0, 26) + "…" : s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="msg bot">
              <div className="bubble">
                <div className="typing"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
        </div>

        {showSuggestions && w.suggestions?.length > 0 && (
          <div className="chat-suggestions">
            <div className="chat-suggestions-label">Try asking</div>
            {w.suggestions.slice(0, 4).map((s, i) => (
              <button key={i} className="suggest" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="chat-input">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask anything about Airanext…"
            rows={1}
          />
          <button className="chat-send" onClick={() => send()} disabled={!draft.trim() || typing} aria-label="Send">
            <Icon name="send" size={14} />
          </button>
        </div>
      </div>
    );
  }

  function ChatLauncher() {
    const [open, setOpen] = useState(false);
    const [config, setConfig] = useState(AiraStore.getConfig());
    useEffect(() => AiraStore.subscribe(() => setConfig(AiraStore.getConfig())), []);
    const w = config.widget;

    if (open) return <Chatbot onClose={() => setOpen(false)} />;
    return (
      <button className="chat-launcher" onClick={() => setOpen(true)} aria-label="Open chatbot">
        <span className="chat-launcher-icon">{w.initial}</span>
        <span>Ask {w.name}</span>
        <span className="ping"></span>
      </button>
    );
  }

  // Auto-mount if a root is present
  const root = document.getElementById("chatbot-root");
  if (root) {
    ReactDOM.createRoot(root).render(<ChatLauncher />);
  }

  window.AiraChatbot = { Chatbot, ChatLauncher };
})();
