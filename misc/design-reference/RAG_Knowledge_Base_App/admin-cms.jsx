// ============================================================
// Admin CMS — customize landing page (config-driven)
// ============================================================

const { useState, useEffect, useRef } = React;

function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div className="toast" key={t.id}>
          <span className="dot"></span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2400);
  };
  return [toasts, push];
}

const ACCENT_OPTIONS = [
  { id: "teal",    color: "#0E8C7E" },
  { id: "indigo",  color: "#4A55E5" },
  { id: "amber",   color: "#D77F1F" },
  { id: "ruby",    color: "#C53A4C" },
  { id: "violet",  color: "#7A3CC2" },
  { id: "forest",  color: "#3F7A3A" },
];

function CMSPage() {
  const [config, setConfig] = useState(AiraStore.getConfig());
  const [toasts, pushToast] = useToasts();
  const fileRef = useRef(null);

  useEffect(() => AiraStore.subscribe(() => setConfig(AiraStore.getConfig())), []);

  const patch = (p) => setConfig(AiraStore.patchConfig(p));
  const patchNested = (key, sub) => patch({ [key]: { ...config[key], ...sub } });
  const patchHero  = (sub) => patch({ hero: sub });
  const patchHeroCard = (sub) => patch({ hero: { card: { ...config.hero.card, ...sub } } });
  const patchSection1 = (sub) => patch({ section1: sub });
  const patchSection2 = (sub) => patch({ section2: sub });
  const patchTrust = (sub) => patch({ trust: sub });
  const patchFooter = (sub) => patch({ footer: sub });
  const patchWidget = (sub) => patch({ widget: sub });
  const patchTheme = (sub) => patch({ theme: sub });

  const setRowAt = (path, i, key, value) => {
    // path is "section1.items" | "section2.items" | "stats.items" | "hero.card.rows"
    const segs = path.split(".");
    const list = segs.reduce((o, s) => o[s], config) || [];
    const next = list.map((row, ix) => ix === i ? { ...row, [key]: value } : row);
    if (path === "section1.items") patchSection1({ items: next });
    else if (path === "section2.items") patchSection2({ items: next });
    else if (path === "stats.items") patch({ stats: { items: next } });
    else if (path === "hero.card.rows") patchHeroCard({ rows: next });
  };

  const setBullets = (i, bi, v) => {
    const items = config.section1.items.map((it, ix) => {
      if (ix !== i) return it;
      const bullets = [...(it.bullets || [])];
      bullets[bi] = v;
      return { ...it, bullets };
    });
    patchSection1({ items });
  };

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await AiraStore.importConfig(f);
      pushToast(`Imported configuration from ${f.name}`);
    } catch {
      pushToast(`Import failed: invalid JSON`);
    }
    e.target.value = "";
  };
  const onExport = () => { AiraStore.exportConfig(); pushToast(`Exported ${config.brand} configuration`); };
  const onReset  = () => { if (!confirm("Reset to Airanext default? Your customizations will be lost.")) return; AiraStore.resetConfig(); pushToast("Reset to default"); };
  const onSave   = () => pushToast("All changes saved");
  const loadPreset = (id) => {
    const p = AiraStore.PRESETS[id];
    if (!p) return;
    AiraStore.loadPreset(id);
    pushToast(`Loaded preset: ${p.label}`);
  };

  return (
    <AdminShell
      page="cms"
      title="Landing CMS"
      sub="Customize the public landing page"
      actions={
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2v6M3 5l3-3 3 3M2 9h8"/></svg>
            Import
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
          <button className="btn btn-ghost btn-sm" onClick={onExport}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 10V4M3 7l3 3 3-3M2 2h8"/></svg>
            Export
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onReset}>Reset</button>
          <button className="btn btn-teal btn-sm" onClick={onSave}>
            Save
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6.5l3 3 5-7"/></svg>
          </button>
        </>
      }
    >
      {/* Preset switcher — proves the layout is identity-agnostic */}
      <div className="preset-bar">
        <div className="preset-bar-label">
          <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Identity preset
          </span>
          <span style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
            Same DOM, different brand — clears your edits and loads a baseline.
          </span>
        </div>
        <div className="preset-bar-options">
          {Object.values(AiraStore.PRESETS).map(p => (
            <button
              key={p.id}
              className="preset-chip"
              data-on={config.brand === p.config.brand}
              onClick={() => loadPreset(p.id)}
            >
              <span className="preset-chip-swatch" style={{ background: p.config.theme.accent }}></span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cms-layout">
        {/* LEFT: form */}
        <div className="cms-form-card">
          <div className="cms-form-scroll">
            <CMSSection ix="01" title="Identity" defaultOpen>
              <label className="field">
                <div className="field-label"><span>Brand name</span><span>{config.brand.length}/40</span></div>
                <input className="input" value={config.brand} onChange={e => patch({ brand: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Tagline</span></div>
                <input className="input" value={config.tagline} onChange={e => patch({ tagline: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Nav items</span><span>comma-separated</span></div>
                <input className="input" value={(config.nav || []).join(", ")} onChange={e => patch({ nav: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </label>
            </CMSSection>

            <CMSSection ix="02" title="Theme">
              <div className="field">
                <div className="field-label"><span>Accent color</span><span>{(config.theme?.accent || "#0E8C7E").toUpperCase()}</span></div>
                <div className="swatch-row">
                  {ACCENT_OPTIONS.map(o => (
                    <button
                      key={o.id}
                      className="swatch"
                      style={{ background: o.color }}
                      data-on={(config.theme?.accent) === o.color}
                      onClick={() => patchTheme({ accent: o.color })}
                      aria-label={o.id}
                    />
                  ))}
                  <label className="swatch" style={{ background: "var(--paper)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                    <input
                      type="color"
                      value={config.theme?.accent || "#0E8C7E"}
                      onChange={e => patchTheme({ accent: e.target.value })}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                    />
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.3"><path d="M7 2v10M2 7h10"/></svg>
                  </label>
                </div>
              </div>
            </CMSSection>

            <CMSSection ix="03" title="Hero">
              <label className="field">
                <div className="field-label"><span>Eyebrow</span></div>
                <input className="input" value={config.hero.eyebrow} onChange={e => patchHero({ eyebrow: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Title</span><span>supports &lt;em&gt; · &lt;br&gt;</span></div>
                <textarea className="textarea" rows={3} value={config.hero.title} onChange={e => patchHero({ title: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Body</span></div>
                <textarea className="textarea" rows={4} value={config.hero.body} onChange={e => patchHero({ body: e.target.value })} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label className="field">
                  <div className="field-label"><span>Primary CTA</span></div>
                  <input className="input" value={config.hero.ctaPrimary} onChange={e => patchHero({ ctaPrimary: e.target.value })} />
                </label>
                <label className="field">
                  <div className="field-label"><span>Secondary CTA</span></div>
                  <input className="input" value={config.hero.ctaSecondary} onChange={e => patchHero({ ctaSecondary: e.target.value })} />
                </label>
              </div>
              <label className="field">
                <div className="field-label"><span>Hero tags</span><span>comma-separated</span></div>
                <input className="input" value={(config.hero.tags || []).join(", ")} onChange={e => patchHero({ tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </label>
            </CMSSection>

            <CMSSection ix="04" title="Hero highlight card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                <label className="field">
                  <div className="field-label"><span>Card label</span></div>
                  <input className="input" value={config.hero.card.label} onChange={e => patchHeroCard({ label: e.target.value })} />
                </label>
                <label className="field">
                  <div className="field-label"><span>Status pill</span></div>
                  <input className="input" value={config.hero.card.livePill} onChange={e => patchHeroCard({ livePill: e.target.value })} />
                </label>
              </div>
              <div className="field">
                <div className="field-label"><span>Rows</span></div>
                {(config.hero.card.rows || []).map((r, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 6, marginBottom: 6 }}>
                    <input className="input" value={r.k} onChange={e => setRowAt("hero.card.rows", i, "k", e.target.value)} />
                    <input className="input" value={r.v} onChange={e => setRowAt("hero.card.rows", i, "v", e.target.value)} />
                  </div>
                ))}
              </div>
              <label className="field">
                <div className="field-label"><span>Chart label</span></div>
                <input className="input" value={config.hero.card.chart?.label || ""} onChange={e => patchHeroCard({ chart: { ...config.hero.card.chart, label: e.target.value } })} />
              </label>
            </CMSSection>

            <CMSSection ix="05" title="Trust strip">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label className="field">
                  <div className="field-label"><span>Headline</span></div>
                  <input className="input" value={config.trust?.count || ""} onChange={e => patchTrust({ count: e.target.value })} />
                </label>
                <label className="field">
                  <div className="field-label"><span>Sub</span></div>
                  <input className="input" value={config.trust?.sub || ""} onChange={e => patchTrust({ sub: e.target.value })} />
                </label>
              </div>
            </CMSSection>

            <CMSSection ix="06" title="Marquee">
              <label className="field">
                <div className="field-label"><span>Items</span><span>comma-separated</span></div>
                <textarea className="textarea" rows={2} value={(config.marquee || []).join(", ")} onChange={e => patch({ marquee: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </label>
            </CMSSection>

            <CMSSection ix="07" title={`Section 1 · ${config.section1.eyebrow}`}>
              <label className="field">
                <div className="field-label"><span>Eyebrow</span></div>
                <input className="input" value={config.section1.eyebrow} onChange={e => patchSection1({ eyebrow: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Title</span><span>supports &lt;em&gt; · &lt;br&gt;</span></div>
                <textarea className="textarea" rows={2} value={config.section1.title} onChange={e => patchSection1({ title: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Body</span></div>
                <textarea className="textarea" rows={3} value={config.section1.body} onChange={e => patchSection1({ body: e.target.value })} />
              </label>
              <div className="field">
                <div className="field-label"><span>Items</span></div>
                {config.section1.items.map((p, i) => (
                  <details key={i} style={{ marginBottom: 8, border: "1px solid var(--rule)", borderRadius: 10, padding: "10px 14px", background: "var(--paper)" }}>
                    <summary style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span><span style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11, marginRight: 8 }}>{p.n}</span>{p.title}</span>
                      {p.featured && <span className="pill" style={{ color: "var(--teal-deep)", borderColor: "var(--teal)" }}><span className="pill-dot"></span>Featured</span>}
                    </summary>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        <input className="input" value={p.title} onChange={e => setRowAt("section1.items", i, "title", e.target.value)} placeholder="Title" />
                        <input className="input" value={p.meta} onChange={e => setRowAt("section1.items", i, "meta", e.target.value)} placeholder="Meta" />
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {(p.bullets || []).map((b, bi) => (
                          <input key={bi} className="input" value={b} onChange={e => setBullets(i, bi, e.target.value)} placeholder={`Bullet ${bi + 1}`} style={{ marginBottom: 6 }} />
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </CMSSection>

            <CMSSection ix="08" title="Stats">
              {(config.stats?.items || []).map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 6, marginBottom: 6 }}>
                  <input className="input" value={s.num} onChange={e => setRowAt("stats.items", i, "num", e.target.value)} />
                  <input className="input" value={s.lbl} onChange={e => setRowAt("stats.items", i, "lbl", e.target.value)} />
                </div>
              ))}
            </CMSSection>

            <CMSSection ix="09" title={`Section 2 · ${config.section2.eyebrow}`}>
              <label className="field">
                <div className="field-label"><span>Eyebrow</span></div>
                <input className="input" value={config.section2.eyebrow} onChange={e => patchSection2({ eyebrow: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Title</span></div>
                <textarea className="textarea" rows={2} value={config.section2.title} onChange={e => patchSection2({ title: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Body</span></div>
                <textarea className="textarea" rows={3} value={config.section2.body} onChange={e => patchSection2({ body: e.target.value })} />
              </label>
              <div className="field">
                <div className="field-label"><span>Steps</span></div>
                {config.section2.items.map((s, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 6, marginBottom: 6 }}>
                    <input className="input" value={s.n} onChange={e => setRowAt("section2.items", i, "n", e.target.value)} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <input className="input" value={s.t} onChange={e => setRowAt("section2.items", i, "t", e.target.value)} placeholder="Title" />
                      <textarea className="textarea" rows={2} value={s.d} onChange={e => setRowAt("section2.items", i, "d", e.target.value)} placeholder="Description" />
                    </div>
                  </div>
                ))}
              </div>
            </CMSSection>

            <CMSSection ix="10" title="Footer">
              <label className="field">
                <div className="field-label"><span>Intro</span></div>
                <textarea className="textarea" rows={3} value={config.footer?.intro || ""} onChange={e => patchFooter({ intro: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Big background word</span></div>
                <input className="input" value={config.footer?.bigWord || ""} onChange={e => patchFooter({ bigWord: e.target.value })} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                <input className="input" value={config.footer?.bottomLeft || ""} onChange={e => patchFooter({ bottomLeft: e.target.value })} placeholder="© line" />
                <input className="input" value={config.footer?.bottomCenter || ""} onChange={e => patchFooter({ bottomCenter: e.target.value })} placeholder="Center text" />
                <input className="input" value={config.footer?.bottomRight || ""} onChange={e => patchFooter({ bottomRight: e.target.value })} placeholder="Version" />
              </div>
            </CMSSection>

            <CMSSection ix="11" title="Chatbot widget">
              <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 10 }}>
                <label className="field">
                  <div className="field-label"><span>Initial</span></div>
                  <input className="input" value={config.widget.initial} maxLength={2} onChange={e => patchWidget({ initial: e.target.value })} />
                </label>
                <label className="field">
                  <div className="field-label"><span>Bot name</span></div>
                  <input className="input" value={config.widget.name} onChange={e => patchWidget({ name: e.target.value })} />
                </label>
              </div>
              <label className="field">
                <div className="field-label"><span>Welcome message</span></div>
                <textarea className="textarea" rows={3} value={config.widget.welcome} onChange={e => patchWidget({ welcome: e.target.value })} />
              </label>
              <label className="field">
                <div className="field-label"><span>Starter prompts</span><span>one per line</span></div>
                <textarea
                  className="textarea"
                  rows={4}
                  value={config.widget.suggestions.join("\n")}
                  onChange={e => patchWidget({ suggestions: e.target.value.split("\n").filter(Boolean) })}
                />
              </label>
            </CMSSection>
          </div>
        </div>

        {/* RIGHT: preview */}
        <div>
          <div className="cms-preview-card">
            <div className="cms-preview-bar">
              <div className="dots"><span/><span/><span/></div>
              <span className="cms-preview-url">{(config.brand || "site").toLowerCase().replace(/\s+/g, "")}.com</span>
            </div>
            <div className="cms-preview-body">
              <MiniPreview config={config} />
            </div>
          </div>
          <div style={{ marginTop: 14, fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.12em", display: "flex", justifyContent: "space-between" }}>
            <span><span style={{ width: 6, height: 6, background: "var(--green)", borderRadius: 99, display: "inline-block", marginRight: 8, verticalAlign: "middle" }}></span>autosaving</span>
            <a href="index.html" target="_blank" rel="noopener" style={{ color: "var(--teal-deep)" }}>open full page ↗</a>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} />
    </AdminShell>
  );
}

function CMSSection({ ix, title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="cms-collapse" data-open={open}>
      <button className="cms-collapse-head" onClick={() => setOpen(o => !o)}>
        <span className="ix">{ix}</span>
        <span className="t">{title}</span>
        <svg className="chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5l3 3 3-3"/></svg>
      </button>
      {open && <div className="cms-collapse-body">{children}</div>}
    </div>
  );
}

function MiniPreview({ config }) {
  const c = config;
  const h = c.hero;
  const card = h.card || {};
  return (
    <div>
      {/* mini nav */}
      <div className="mp-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--display)", fontWeight: 600, fontSize: 14 }}>
          <svg width="16" height="16" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="24" height="24" rx="6" fill="var(--ink)"/>
            <path d="M13 5L20 19H17.5L13 9.5L8.5 19H6L13 5Z" fill="#fff"/>
            <circle cx="13" cy="19.5" r="2" fill="var(--teal-bright)"/>
          </svg>
          <span>{c.brand}</span>
        </div>
        <div className="mp-nav-links">{(c.nav || []).slice(0, 4).map(n => <span key={n}>{n}</span>)}</div>
        <div className="mp-nav-right">
          <span style={{ fontSize: 11, padding: "3px 10px", border: "1px solid var(--rule)", borderRadius: 99 }}>Sign in</span>
          <span style={{ fontSize: 11, padding: "3px 10px", background: "var(--teal)", color: "#fff", borderRadius: 99 }}>{(h.ctaPrimary || "").split(" ").slice(0, 2).join(" ")}</span>
        </div>
      </div>

      <div className="mp-hero">
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--teal-deep)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>
          ◆  {h.eyebrow}
        </div>
        <h1 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: "clamp(26px, 4.5vw, 38px)", lineHeight: 0.98, letterSpacing: "-0.025em", margin: 0 }}
            dangerouslySetInnerHTML={{ __html: h.title }} />
        <p style={{ marginTop: 16, fontSize: 13.5, color: "var(--ink-2)", maxWidth: "52ch", lineHeight: 1.5 }}>{h.body}</p>
        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <span style={{ padding: "7px 14px", background: "var(--teal)", color: "#fff", borderRadius: 99, fontSize: 13 }}>{h.ctaPrimary}</span>
          <span style={{ padding: "7px 14px", border: "1px solid var(--ink)", borderRadius: 99, fontSize: 13 }}>{h.ctaSecondary}</span>
        </div>

        <div style={{ marginTop: 22, padding: 16, background: "var(--ink)", color: "#fff", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {card.label}{card.livePill ? ` — ${card.livePill}` : ""}
            </span>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--teal-bright)" }}></span>
          </div>
          {(card.rows || []).map(r => (
            <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: 12 }}>
              <span style={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--mono)", fontSize: 10 }}>{r.k}</span>
              <span>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
          {(c.stats?.items || []).slice(0, 4).map((s, i) => (
            <div key={i} style={{ padding: "14px 10px", borderRight: i < 3 ? "1px solid var(--rule)" : 0 }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 22, lineHeight: 1, letterSpacing: "-0.02em" }}
                   dangerouslySetInnerHTML={{ __html: s.num }} />
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginTop: 8 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CMSPage />);
