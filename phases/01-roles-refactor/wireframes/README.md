# Wireframes — Phase 01: roles-refactor

Low-fidelity ASCII wireframes for every user-facing surface this phase touches. The goal is **structural intent**, not visual design — boxes, labels, states. Fast to draw, fast to change. Implementation can deviate stylistically as long as the structure and state coverage holds.

## Screen index

| # | Screen | Audience | New / Modified |
|---|---|---|---|
| 1 | [login.md](login.md) | Everyone | Modified (role-based redirect after sign-in) |
| 2 | [admin-shell.md](admin-shell.md) | super_admin, admin | Modified (role-aware sidebar visibility) |
| 3 | [admin-knowledge-base.md](admin-knowledge-base.md) | super_admin, admin | Modified (new Rename action + dialog) |
| 4 | [user-workspace.md](user-workspace.md) | user | **New** (read-only KB list + auto-opened wider chat) |
| 5 | [users.md](users.md) | super_admin, admin | **New** (list + create + deactivate) |
| 6 | [landing-config.md](landing-config.md) | super_admin only | Modified (chat-mode toggle + brand presets) |
| 7 | [public-landing-widget.md](public-landing-widget.md) | anonymous | Modified (two states: public chat / "sign in" gate) |

## Conventions

- `[Button]` = primary action; `[Cancel]` = secondary
- `( )` / `(●)` = unselected / selected radio
- `[ ]` / `[x]` = unchecked / checked checkbox
- `▾` = dropdown / menu trigger
- `🔒` `✏️` `🗑️` `🔄` = lock / edit / delete / refresh icons (replace with real icons at implementation; placement is what matters)
- Bracketed prose like `{like this}` = placeholder / variable copy

## What's deliberately not wireframed

- Sign-out flows, 404 / 500 error pages, generic loading states between routes — these inherit the existing app's behavior, no design questions here.
- Chat widget conversation rendering (already exists; this phase doesn't change the message bubbles, source-chip layout, or streaming behavior).
