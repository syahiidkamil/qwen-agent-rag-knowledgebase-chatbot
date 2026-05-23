// ============================================================
// Landing page — fully config-driven template.
// Centered hero with grid bg · dark stats · elevated featured
// program · 4-step horizontal flow · dark footer wordmark.
//
// Every label and value comes from AiraStore. The DOM stays
// identical when you swap identity presets.
// ============================================================

const { useState, useEffect } = React;

function BrandMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <rect x="1" y="1" width="24" height="24" rx="6" fill="#061B22"/>
      <path d="M13 5L20 19H17.5L13 9.5L8.5 19H6L13 5Z" fill="#FFFFFF"/>
      <circle cx="13" cy="19.5" r="2" fill="var(--teal, #1FC7AE)"/>
    </svg>
  );
}

// derive a tag from "Pulse · SaaS" style label, or just first nav
function pillFromBrand(brand) {
  if (!brand) return "";
  // last word in brand becomes a chip; "Airanext Camp" → "Camp"
  const parts = brand.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function Nav({ config }) {
  const chip = pillFromBrand(config.brand);
  const brandHead = chip
    ? config.brand.replace(new RegExp("\\s+" + chip + "$"), "")
    : config.brand;

  return (
    <nav className="land-nav">
      <div className="land-nav-inner">
        <a href="index.html" className="brand">
          <span className="brand-mark"><BrandMark /></span>
          <span className="brand-name">
            {brandHead}
            {chip && <span className="brand-chip">{chip}</span>}
          </span>
        </a>
        <div className="land-nav-links">
          {(config.nav || []).map(item => (
            <a key={item} href={"#" + item.toLowerCase().replace(/\s+/g, "-")}>{item}</a>
          ))}
        </div>
        <div className="land-nav-right">
          <a href="login.html" className="land-nav-login">Log in</a>
          <a href="#apply" className="btn btn-teal btn-sm">
            {(config.hero.ctaPrimary || "Get started").split(" ").slice(0, 2).join(" ")}
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero({ config }) {
  const h = config.hero;
  const t = config.trust || {};
  return (
    <header className="land-hero" id="apply">
      <div className="land-hero-bg" aria-hidden="true"></div>
      <div className="land-hero-inner">
        <div className="hero-pill">
          <span className="hero-pill-dot"></span>
          {h.eyebrow}
        </div>
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: h.title }} />
        <p className="hero-body">{h.body}</p>
        <div className="hero-cta-row">
          <a href="#apply" className="btn btn-ink btn-lg">
            {h.ctaPrimary}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
          </a>
          <a href="#curriculum" className="btn btn-outline btn-lg">{h.ctaSecondary}</a>
        </div>

        {(config.layout?.showTrust !== false) && t.count && (
          <div className="hero-trust">
            <div className="hero-trust-avatars">
              {(t.avatars || []).map((bg, i) => (
                <span key={i} className="hero-trust-av" style={{ background: bg }}></span>
              ))}
            </div>
            <p className="hero-trust-text">
              Joined by <b>{t.count}</b> {t.sub}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <section className="marquee">
      <div className="marquee-track">
        {doubled.map((it, i) => (
          <span className="marquee-item" key={i}>{it}</span>
        ))}
      </div>
    </section>
  );
}

function Stats({ config }) {
  const items = config.stats?.items || [];
  return (
    <section className="stats-strip">
      <div className="stats-inner">
        {items.map((s, i) => (
          <div key={i} className="stat">
            <div className="stat-num" dangerouslySetInnerHTML={{ __html: s.num }} />
            <div className="stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Section1({ config }) {
  const s = config.section1;
  return (
    <section className="land-section" id={s.eyebrow.toLowerCase().replace(/\s+/g, "-")}>
      <div className="land-section-inner">
        <div className="land-section-head">
          <h2 className="land-section-title" dangerouslySetInnerHTML={{ __html: s.title }} />
          <p className="land-section-body">{s.body}</p>
        </div>

        <div className="programs">
          {(s.items || []).map(p => (
            <article key={p.n} className="program-card" data-featured={p.featured}>
              {p.featured && <span className="program-badge">Most popular</span>}
              <h3 className="program-title">{p.title}</h3>
              <p className="program-meta">{p.meta}</p>
              <ul className="program-list">
                {(p.bullets || []).map((b, i) => (
                  <li key={i}>
                    <svg className="check" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.5 9.5l3.5 3.5 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className="program-cta">{p.cta}</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Section2({ config }) {
  const s = config.section2;
  const items = s.items || [];
  return (
    <section className="land-section land-section-alt" id={s.eyebrow.toLowerCase().replace(/\s+/g, "-")}>
      <div className="land-section-inner">
        <div className="land-section-head">
          <h2 className="land-section-title" dangerouslySetInnerHTML={{ __html: s.title }} />
          <p className="land-section-body">{s.body}</p>
        </div>

        <div className="flow" style={{ "--flow-count": items.length }}>
          {items.map((step, i) => {
            const last = i === items.length - 1;
            return (
              <div key={i} className="flow-step" data-last={last}>
                <div className="flow-num" data-last={last}>{step.n}</div>
                {!last && <div className="flow-line" aria-hidden="true"></div>}
                <h4 className="flow-title">{step.t}</h4>
                <p className="flow-body">{step.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer({ config }) {
  const f = config.footer || {};
  return (
    <footer className="land-footer">
      {f.bigWord && (config.layout?.showFooterBigWord !== false) && (
        <div className="land-footer-word" aria-hidden="true">{f.bigWord}</div>
      )}
      <div className="land-footer-inner">
        <div className="foot-grid">
          <div className="foot-col foot-col-brand">
            <div className="brand brand-dark">
              <span className="brand-mark"><BrandMark /></span>
              <span className="brand-name">{config.brand}</span>
            </div>
            <p className="foot-intro">{f.intro}</p>
          </div>
          {(f.columns || []).map(col => (
            <div className="foot-col" key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map(l => {
                  const isMail = l.includes("@");
                  const isSign = /sign\s?in|log\s?in/i.test(l);
                  const href = isMail ? `mailto:${l}` : isSign ? "login.html" : "#";
                  return <li key={l}><a href={href}>{l}</a></li>;
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="foot-bottom">
          <span>{f.bottomLeft}</span>
          <div className="foot-socials">
            <a href="#" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.29 20.25c7.55 0 11.68-6.25 11.68-11.68v-.53A8.35 8.35 0 0 0 22 5.92a8.19 8.19 0 0 1-2.36.65 4.12 4.12 0 0 0 1.8-2.27 8.22 8.22 0 0 1-2.6 1 4.11 4.11 0 0 0-7 3.74 11.65 11.65 0 0 1-8.46-4.29 4.11 4.11 0 0 0 1.27 5.48A4.07 4.07 0 0 1 2.8 9.71v.05a4.1 4.1 0 0 0 3.3 4.02 4.1 4.1 0 0 1-1.86.07 4.11 4.11 0 0 0 3.84 2.85A8.23 8.23 0 0 1 2 18.41a11.62 11.62 0 0 0 6.29 1.84z"/>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0H5a5 5 0 0 0-5 5v14a5 5 0 0 0 5 5h14a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zM8 19H5V8h3v11zM6.5 6.73a1.77 1.77 0 1 1 0-3.53 1.77 1.77 0 0 1 0 3.53zM20 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77c1.4-2.59 7-2.78 7 2.47V19z"/>
              </svg>
            </a>
            <a href="#" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.16c-3.34.72-4.04-1.41-4.04-1.41-.54-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.08 1.84 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.94 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.13 3.18a4.65 4.65 0 0 1 1.24 3.23c0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3"/>
              </svg>
            </a>
          </div>
          <span>{f.bottomCenter} · {f.bottomRight}</span>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const [config, setConfig] = useState(AiraStore.getConfig());
  useEffect(() => AiraStore.subscribe(() => setConfig(AiraStore.getConfig())), []);

  return (
    <>
      <Nav config={config} />
      <main>
        <Hero config={config} />
        {(config.layout?.showMarquee !== false) && <Marquee items={config.marquee || []} />}
        {(config.layout?.showStats !== false) && <Stats config={config} />}
        <Section1 config={config} />
        <Section2 config={config} />
      </main>
      <Footer config={config} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
