// ============================================================
// Admin — Knowledge base
// ============================================================

const { useState, useEffect, useRef, useCallback } = React;

const STATUS_FILTERS = ["all", "uploaded", "ingesting", "ingested", "failed"];

function KBPage() {
  const [files, setFiles] = useState(AiraStore.getFiles());
  const [drag, setDrag] = useState(false);
  const [ingestOnUpload, setIngestOnUpload] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toasts, pushToast] = useToasts();
  const inputRef = useRef(null);

  useEffect(() => AiraStore.subscribe(() => setFiles(AiraStore.getFiles())), []);

  // Simulate ingest progress for files in 'ingesting' state
  useEffect(() => {
    const ingesting = files.filter(f => f.status === "ingesting");
    if (!ingesting.length) return;
    const t = setInterval(() => {
      const current = AiraStore.getFiles();
      const next = current.map(f => {
        if (f.status !== "ingesting") return f;
        const np = Math.min(100, f.progress + 3 + Math.random() * 5);
        if (np >= 100) {
          const chunks = Math.max(8, Math.round(f.size / 6000) + Math.floor(Math.random() * 12));
          pushToast(`${f.name} → ingested · ${chunks} chunks`);
          return { ...f, status: "ingested", progress: 100, chunks };
        }
        return { ...f, progress: np };
      });
      AiraStore.setFiles(next);
    }, 450);
    return () => clearInterval(t);
  }, [files]);

  const counts = files.reduce((acc, f) => {
    acc.all = (acc.all || 0) + 1;
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});
  const filtered = files.filter(f => {
    if (filter !== "all" && f.status !== filter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addFiles = useCallback((dropped) => {
    const newOnes = Array.from(dropped).map(f => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      return {
        id: "f" + Math.random().toString(36).slice(2, 9),
        name: f.name,
        size: f.size,
        type: ["pdf","docx","md","txt","csv","json","html"].includes(ext) ? ext : "file",
        status: ingestOnUpload ? "ingesting" : "uploaded",
        uploaded: "just now",
        chunks: 0,
        progress: ingestOnUpload ? 4 : 0,
      };
    });
    AiraStore.setFiles([...newOnes, ...AiraStore.getFiles()]);
    pushToast(`Added ${newOnes.length} file${newOnes.length !== 1 ? "s" : ""}${ingestOnUpload ? " · ingest started" : " · awaiting ingest"}`);
  }, [ingestOnUpload]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const ingestFile = (id) => {
    const next = AiraStore.getFiles().map(f =>
      f.id === id ? { ...f, status: "ingesting", progress: 4, error: undefined } : f
    );
    AiraStore.setFiles(next);
    const file = next.find(f => f.id === id);
    if (file) pushToast(`Ingesting ${file.name}`);
  };
  const removeFile = (id) => {
    const file = AiraStore.getFiles().find(f => f.id === id);
    AiraStore.setFiles(AiraStore.getFiles().filter(f => f.id !== id));
    if (file) pushToast(`Removed ${file.name}`);
  };
  const retryFile = (id) => {
    const next = AiraStore.getFiles().map(f =>
      f.id === id ? { ...f, status: "uploaded", error: undefined } : f
    );
    AiraStore.setFiles(next);
  };

  const ingestAllPending = () => {
    const pending = AiraStore.getFiles().filter(f => f.status === "uploaded");
    if (!pending.length) {
      pushToast("Nothing to ingest");
      return;
    }
    AiraStore.setFiles(AiraStore.getFiles().map(f =>
      f.status === "uploaded" ? { ...f, status: "ingesting", progress: 4 } : f
    ));
    pushToast(`Ingesting ${pending.length} pending file${pending.length !== 1 ? "s" : ""}`);
  };

  const totalIngested = files.filter(f => f.status === "ingested").length;
  const totalChunks = files.reduce((n, f) => n + (f.chunks || 0), 0);
  const totalSize = files.reduce((n, f) => n + (f.size || 0), 0);
  const pendingCount = files.filter(f => f.status === "uploaded").length;

  return (
    <AdminShell
      page="kb"
      title="Knowledge base"
      sub="Ingest the corpus that powers Aira"
      actions={
        <>
          {pendingCount > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={ingestAllPending}>
              Ingest all pending ({pendingCount})
            </button>
          )}
          <button className="btn btn-teal btn-sm" onClick={() => inputRef.current?.click()}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2v8M3 5l3-3 3 3"/></svg>
            Upload
          </button>
          <input ref={inputRef} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
        </>
      }
    >
      {/* Dropzone */}
      <div
        className="dropzone"
        data-drag={drag}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <div className="dropzone-text">
          <div className="dropzone-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4v14M7 10l6-6 6 6M4 22h18"/>
            </svg>
          </div>
          <div className="dropzone-title">Drop documents here</div>
          <div className="dropzone-sub">
            PDF · DOCX · MD · TXT · CSV · HTML  ·  max 50 MB per file
          </div>
        </div>
        <div className="dropzone-controls">
          <button className="btn btn-sm" onClick={() => inputRef.current?.click()}>
            Browse files
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 1v8M3 6l3 3 3-3M1 11h10"/></svg>
          </button>
          <label className="checkbox-row" onClick={(e) => { e.preventDefault(); setIngestOnUpload(v => !v); }}>
            <span className="cbx" data-on={ingestOnUpload}>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 6.5L5 9l5-6"/></svg>
            </span>
            Ingest immediately on upload
          </label>
        </div>
      </div>

      {/* Toolbar */}
      <div className="kb-toolbar">
        <div className="search">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}><circle cx="6" cy="6" r="4"/><path d="M9 9l4 4"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by filename…" />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "transparent", border: 0, color: "var(--muted)", fontSize: 16, padding: 0, lineHeight: 1, cursor: "pointer" }}>×</button>
          )}
        </div>
        <div className="filters">
          {STATUS_FILTERS.map(s => (
            <button key={s} className="filter-chip" data-on={filter === s} onClick={() => setFilter(s)}>
              {s} <span className="ct">{counts[s] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="kb-empty">
            {search || filter !== "all"
              ? "Nothing matches that filter."
              : "Drop a document above to begin."}
          </div>
        ) : (
          <table className="kb-table">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>File</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th style={{ textAlign: "right" }}>Size</th>
                <th style={{ textAlign: "right" }}>Chunks</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <FileRow key={f.id} file={f} onIngest={ingestFile} onRemove={removeFile} onRetry={retryFile} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast toasts={toasts} />
    </AdminShell>
  );
}

function FileRow({ file: f, onIngest, onRemove, onRetry }) {
  return (
    <tr>
      <td>
        <div className="file-cell">
          <div className="file-icon" data-type={f.type}>{f.type.toUpperCase()}</div>
          <div>
            <div className="file-name">{f.name}</div>
            {f.error && <div className="file-sub" style={{ color: "var(--red)" }}>{f.error}</div>}
            {!f.error && f.status === "ingested" && <div className="file-sub">embedded · {f.chunks} chunks indexed · text-embed-3</div>}
            {!f.error && f.status === "uploaded" && <div className="file-sub">awaiting ingest</div>}
            {!f.error && f.status === "ingesting" && <div className="file-sub">embedding · vectorizing · indexing</div>}
          </div>
        </div>
      </td>
      <td>
        <span className={`pill ${f.status}`}>
          <span className="pill-dot"></span>
          {f.status}
          {f.status === "ingesting" && (
            <span className="progress-bar"><span className="progress-fill" style={{ width: f.progress + "%" }}></span></span>
          )}
        </span>
      </td>
      <td><span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--muted)" }}>{f.uploaded}</span></td>
      <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>{fmtBytes(f.size)}</td>
      <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: f.chunks ? "var(--ink-2)" : "var(--muted-2)", fontVariantNumeric: "tabular-nums" }}>{f.chunks || "—"}</td>
      <td>
        <div className="row-actions">
          {f.status === "uploaded" && (
            <button className="row-act row-act-primary" onClick={() => onIngest(f.id)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 5.5L5 8l4-5.5"/></svg>
              Ingest
            </button>
          )}
          {f.status === "failed" && (
            <button className="row-act" onClick={() => onRetry(f.id)}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5.5a3.5 3.5 0 1 0 1-2.5M2 2v2.5h2.5"/></svg>
              Retry
            </button>
          )}
          {f.status === "ingested" && (
            <button className="row-act" onClick={() => onIngest(f.id)} title="Re-embed this file">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5.5a3.5 3.5 0 1 0 1-2.5M2 2v2.5h2.5"/></svg>
              Re-ingest
            </button>
          )}
          <button className="row-act row-act-danger" onClick={() => onRemove(f.id)} title="Remove" aria-label="Remove">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h7M4 3V2h3v1M3.5 3l.5 7h3l.5-7"/></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// Toasts + hook (re-used here, defined in admin-cms.jsx but admin-cms doesn't load on KB page —
// so keep a local copy):
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
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };
  return [toasts, push];
}

ReactDOM.createRoot(document.getElementById("root")).render(<KBPage />);
