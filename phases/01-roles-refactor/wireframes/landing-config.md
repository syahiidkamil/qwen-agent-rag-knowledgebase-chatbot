# Wireframe: Landing config (super_admin only)

## Purpose
**Modified page (super_admin gate added; chat-mode toggle added).** Single place for super_admin to control what the public landing page looks like and whether the chat widget is publicly usable.

## Default State

```
+-----------------------------------------------------------------------------+
|  Landing config                                                             |
+-----------------------------------------------------------------------------+
|                                                                             |
|  ┌─ Chat mode ───────────────────────────────────────────────────────────┐  |
|  │                                                                       │  |
|  │  Who can use the chat widget on the landing page?                     │  |
|  │                                                                       │  |
|  │  (●) Public        Anyone visiting the page                           │  |
|  │  ( ) Internal      Only signed-in users (CS, sales, etc.)             │  |
|  │                                                                       │  |
|  │                                            Currently: Public 🟢       │  |
|  └───────────────────────────────────────────────────────────────────────┘  |
|                                                                             |
|  ┌─ Brand presets ───────────────────────────────────────────────────────┐  |
|  │                                                                       │  |
|  │  Hero headline                                                        │  |
|  │  ┌─────────────────────────────────────────────────────────────────┐  │  |
|  │  │ Engineers who ship in the real world                            │  │  |
|  │  └─────────────────────────────────────────────────────────────────┘  │  |
|  │                                                                       │  |
|  │  Subheadline                                                          │  |
|  │  ┌─────────────────────────────────────────────────────────────────┐  │  |
|  │  │ Cohort-based AI engineering, in person + async                  │  │  |
|  │  └─────────────────────────────────────────────────────────────────┘  │  |
|  │                                                                       │  |
|  │  Primary CTA label                                                    │  |
|  │  ┌─────────────────────────────────────────────────────────────────┐  │  |
|  │  │ Apply for cohort 14                                             │  │  |
|  │  └─────────────────────────────────────────────────────────────────┘  │  |
|  │                                                                       │  |
|  │  ... {other existing brand preset fields the page already has} ...    │  |
|  └───────────────────────────────────────────────────────────────────────┘  |
|                                                                             |
|                                                       [ Save changes ]      |
+-----------------------------------------------------------------------------+
```

## Other States

- **Loading config**: form skeleton; `[Save changes]` disabled.
- **Saving**: button shows spinner; inputs disabled.
- **Save error**: toast — "Couldn't save. Try again or refresh." No optimistic update; form stays dirty.
- **Save success**: toast — "Saved." Form clears dirty state.
- **Chat-mode change pending save**: the "Currently: …" status chip shows a dashed border + the *unsaved* mode label until save lands.
- **Admin (non-super) attempts access**: route redirects to `/admin/knowledge` (or shows a 403 view); sidebar item is hidden anyway.

## Interactions

- Chat mode radio → toggles selection; does NOT save until `[Save changes]` clicked (one save action for the whole form, to match existing landing-config UX).
- `[Save changes]` → `PUT /api/landing-config` with the full config blob (existing endpoint behavior). On success: toast + reset dirty.
- Brand preset fields → free text inputs, exact field set inherits from current implementation; this phase doesn't add or remove brand fields.

## Notes

- Both Chat mode AND brand presets live in `landing_config.config` JSONB. One save covers both.
- `chat_mode` value: `"public"` | `"internal"`. Default `"public"` if the key is absent (backwards compatibility).
- The radio control's labels match the SPEC's user-visible vocabulary exactly: "Public" / "Internal". No tech jargon.
- Backend gate: `require_role("super_admin")` on `PUT /api/landing-config`. The endpoint already exists; just tighten the dependency.
- Read endpoint (`GET /api/landing-config`) stays publicly readable — the landing page itself fetches it anonymously to render the brand presets.
- Future-friendly: if a Preview button is added later (preview the landing page in a side panel), the data shape doesn't change — just the UI.
