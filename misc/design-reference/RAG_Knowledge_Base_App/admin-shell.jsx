// ============================================================
// Admin shell — shared sidebar + topbar.
// Exposes <AdminShell page="cms" | "kb">{children}</AdminShell>
// ============================================================

const { useState, useEffect } = React;

function SideIcon({ name }) {
  const c = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "cms") return <svg className="sl-icon" {...c}><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12M5 9h4"/></svg>;
  if (name === "kb")  return <svg className="sl-icon" {...c}><path d="M3 3h7l3 3v7H3z"/><path d="M10 3v3h3M5 9h6M5 11h4"/></svg>;
  if (name === "home") return <svg className="sl-icon" {...c}><path d="M3 7l5-4 5 4v6H3z"/></svg>;
  if (name === "preview") return <svg className="sl-icon" {...c}><path d="M2 8c2-3 4-4 6-4s4 1 6 4c-2 3-4 4-6 4s-4-1-6-4z"/><circle cx="8" cy="8" r="2"/></svg>;
  return null;
}

function AdminShell({ page, title, sub, actions, children }) {
  const [config, setConfig] = useState(AiraStore.getConfig());
  const [files, setFiles] = useState(AiraStore.getFiles());
  useEffect(() => AiraStore.subscribe(() => {
    setConfig(AiraStore.getConfig());
    setFiles(AiraStore.getFiles());
  }), []);

  // Auth gate (dummy)
  useEffect(() => {
    if (!AiraStore.isLoggedIn()) {
      window.location.href = "login.html";
    }
  }, []);

  const totalFiles = files.length;
  const pendingFiles = files.filter(f => f.status === "uploaded" || f.status === "ingesting").length;

  const logout = () => {
    AiraStore.logout();
    window.location.href = "login.html";
  };

  const pages = [
    { id: "cms", label: "Landing CMS",   icon: "cms", href: "admin-cms.html",       count: null },
    { id: "kb",  label: "Knowledge base", icon: "kb",  href: "admin-knowledge.html", count: totalFiles },
  ];

  return (
    <div className="admin-app">
      <aside className="admin-side">
        <a href="index.html" className="admin-side-brand">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
            <rect x="1" y="1" width="24" height="24" rx="6" fill="var(--ink)"/>
            <path d="M13 5L20 19H17.5L13 9.5L8.5 19H6L13 5Z" fill="#fff"/>
            <circle cx="13" cy="19.5" r="2" fill="var(--teal-bright)"/>
          </svg>
          <span>{config.brand}</span>
        </a>

        <div className="admin-side-section">Manage</div>
        {pages.map(p => (
          <a key={p.id} href={p.href} className="admin-side-link" data-active={page === p.id}>
            <SideIcon name={p.icon} />
            <span>{p.label}</span>
            {p.count != null && <span className="sl-count">{p.count}</span>}
          </a>
        ))}

        <div className="admin-side-section">Visit</div>
        <a href="index.html" className="admin-side-link" target="_blank" rel="noopener">
          <SideIcon name="preview" />
          <span>View public site</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted-2)" }}>↗</span>
        </a>

        <div className="admin-user">
          <div className="admin-user-av">C</div>
          <div className="admin-user-meta">
            <div className="admin-user-name">Citra Pradana</div>
            <div className="admin-user-mail">ops@airanext.id</div>
          </div>
          <button className="icon-btn-sm icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h4a1 1 0 001-1V9M6 6.5h6M10 4l2.5 2.5L10 9"/></svg>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-top">
          <div className="crumb">
            <span>Admin</span>
            <span>/</span>
            <b>{title}</b>
          </div>
          <div className="admin-top-right">
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 8px" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: "var(--green)", marginRight: 8, verticalAlign: "middle" }}></span>
              workspace · airanext
            </span>
          </div>
        </div>

        <div className="admin-content">
          <div className="page-head">
            <div>
              <span className="eyebrow">{title}</span>
              <h1 className="page-title">{sub}</h1>
            </div>
            <div className="page-actions">{actions}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell, SideIcon });
