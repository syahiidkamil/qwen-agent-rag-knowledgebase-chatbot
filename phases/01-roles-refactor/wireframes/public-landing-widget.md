# Wireframe: Public landing — chat widget states

## Purpose
The existing marketing landing page. This phase adds a second state to its chat widget: when `landing_config.chat_mode === "internal"` AND the visitor is not signed in, the widget shows a "Sign in to chat" gate instead of the chat form.

## State A — `chat_mode = public` (current behavior, unchanged)

```
+----------------------------------------------------------------------------+
|                                                                            |
|   Engineers who ship in the real world                                     |
|   Cohort-based AI engineering, in person + async                           |
|                                                                            |
|   [ Apply for cohort 14 ]                                                  |
|                                                                            |
|                                                                            |
|                                              ┌─ Chat with Aira ────────┐  |
|                                              │  GROUNDED               │  |
|                                              │                         │  |
|                                              │  Hi! I'm Aira — ask     │  |
|                                              │  about programs,        │  |
|                                              │  tuition, etc.          │  |
|                                              │                         │  |
|                                              │  ┌───────────────────┐  │  |
|                                              │  │ Ask anything...   │  │  |
|                                              │  └───────────────────┘  │  |
|                                              └─────────────────────────┘  |
+----------------------------------------------------------------------------+
```

## State B — `chat_mode = internal`, anonymous visitor

```
+----------------------------------------------------------------------------+
|                                                                            |
|   Engineers who ship in the real world                                     |
|   Cohort-based AI engineering, in person + async                           |
|                                                                            |
|   [ Apply for cohort 14 ]                                                  |
|                                                                            |
|                                                                            |
|                                              ┌─ Chat with Aira ────────┐  |
|                                              │                         │  |
|                                              │   🔒                    │  |
|                                              │                         │  |
|                                              │   Internal use only.    │  |
|                                              │                         │  |
|                                              │   Sign in to chat with  │  |
|                                              │   Aira.                 │  |
|                                              │                         │  |
|                                              │       [ Sign in ]       │  |
|                                              │                         │  |
|                                              └─────────────────────────┘  |
+----------------------------------------------------------------------------+
```

## State C — `chat_mode = internal`, visitor IS signed in (any role)

Same as State A — the widget renders normally because the visitor has a valid Bearer token. Logged-in users (super_admin / admin / user) can chat from the public landing page just as they can from `/workspace`.

## Other States

- **Loading landing_config**: widget area shows a low-fi skeleton block until the config + auth state both resolve. ~150ms ceiling on a warm cache.
- **Mid-conversation flip to internal** (user was chatting anonymously when super_admin flipped the mode): the in-flight stream completes; the next user message attempt receives a 401; the widget UI replaces itself with State B's "Sign in to chat" block above the conversation history. The history stays visible but greyed out; no future sends possible.
- **API down**: widget shows generic "Chat unavailable right now" — same as today, no new state needed.

## Interactions

- State B `[Sign in]` → navigate to `/login`; on successful sign-in, role-based redirect kicks in (user → `/workspace`; admin → `/admin`). The visitor does NOT return to the landing page automatically.
- State A: existing chat flow, no change.
- Minimize / maximize toggles on the widget header: existing behavior, no change.

## Notes

- The landing page fetches `GET /api/landing-config` (publicly readable) on mount and reads `config.chat_mode` (defaulting to `"public"` if absent).
- The backend chat endpoint independently enforces the gate: when no Bearer token is present AND `chat_mode === "internal"`, return 401. The FE check is UX-only; the BE check is authoritative.
- This is the single biggest visitor-facing change in the phase. Test critical path (TC-01-006) covers it.
- `[Sign in]` button reuses the existing login button style. No new component.
