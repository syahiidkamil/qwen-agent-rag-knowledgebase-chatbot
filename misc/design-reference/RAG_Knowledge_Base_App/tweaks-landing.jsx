// ============================================================
// Landing page Tweaks panel
// Live identity / layout switcher — proves the layout is
// independent of any single company's content.
// ============================================================

(function () {
  const { useState, useEffect } = React;

  // No useTweaks() here — state is driven by AiraStore so the tweak
  // controls reflect (and mutate) the same data the CMS / chatbot read.

  function LandingTweaks() {
    const [config, setConfig] = useState(AiraStore.getConfig());
    useEffect(() => AiraStore.subscribe(() => setConfig(AiraStore.getConfig())), []);

    const presets = Object.values(AiraStore.PRESETS);
    const layout = config.layout || {};

    // Detect active preset by brand match (so editing brand → "custom")
    const activePresetId =
      presets.find(p => p.config.brand === config.brand)?.id || "custom";

    const setLayout = (key, value) =>
      AiraStore.patchConfig({ layout: { [key]: value } });

    const accentSwatches = [
      "#0E8C7E", "#4A55E5", "#C53A4C", "#D77F1F", "#7A3CC2", "#3F7A3A",
    ];

    return (
      <TweaksPanel title="Tweaks">
        {/* ── Identity ─────────────────────────────────────── */}
        <TweakSection label="Identity preset">
          <div className="tw-preset-grid">
            {presets.map(p => (
              <button
                key={p.id}
                className="tw-preset"
                data-on={activePresetId === p.id}
                onClick={() => AiraStore.loadPreset(p.id)}
              >
                <span className="tw-preset-swatch" style={{ background: p.config.theme.accent }}></span>
                <span className="tw-preset-name">{p.config.brand}</span>
                <span className="tw-preset-tag">{p.label.split(" · ")[0]}</span>
              </button>
            ))}
          </div>
          {activePresetId === "custom" && (
            <div className="tw-note">
              <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--warm, #F2B83C)", display: "inline-block", marginRight: 8, verticalAlign: "middle" }}></span>
              Custom — edits diverge from a baseline preset
            </div>
          )}
        </TweakSection>

        {/* ── Theme ──────────────────────────────────────── */}
        <TweakSection label="Accent">
          <TweakColor
            label="Color"
            value={config.theme?.accent || "#0E8C7E"}
            options={accentSwatches}
            onChange={v => AiraStore.patchConfig({ theme: { accent: v } })}
          />
        </TweakSection>

        {/* ── Layout blocks ──────────────────────────────── */}
        <TweakSection label="Sections">
          <TweakToggle
            label="Trust strip"
            value={layout.showTrust !== false}
            onChange={v => setLayout("showTrust", v)}
          />
          <TweakToggle
            label="Marquee row"
            value={layout.showMarquee !== false}
            onChange={v => setLayout("showMarquee", v)}
          />
          <TweakToggle
            label="Stats strip"
            value={layout.showStats !== false}
            onChange={v => setLayout("showStats", v)}
          />
          <TweakToggle
            label="Footer wordmark"
            value={layout.showFooterBigWord !== false}
            onChange={v => setLayout("showFooterBigWord", v)}
          />
        </TweakSection>

        {/* ── Quick text overrides ──────────────────────── */}
        <TweakSection label="Quick override">
          <TweakText
            label="Brand"
            value={config.brand}
            onChange={v => AiraStore.patchConfig({ brand: v })}
          />
          <TweakText
            label="Hero eyebrow"
            value={config.hero.eyebrow}
            onChange={v => AiraStore.patchConfig({ hero: { eyebrow: v } })}
          />
        </TweakSection>

        <TweakSection label="Reset">
          <TweakButton label="Reset to Airanext baseline" onClick={() => AiraStore.loadPreset("airanext")} />
        </TweakSection>
      </TweaksPanel>
    );
  }

  // Mount alongside the main app
  const root = document.createElement("div");
  root.id = "tweaks-root";
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<LandingTweaks />);
})();
