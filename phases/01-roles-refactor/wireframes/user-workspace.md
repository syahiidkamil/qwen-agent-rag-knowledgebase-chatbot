# Wireframe: User workspace (`/workspace`)

## Purpose
**New screen.** Where the `user` role lands after sign-in. A read-only view of the knowledge base they can chat against, with the chat widget auto-opened and wider than the public-marketing-page version. Audience is any internal teammate — customer service, sales, support, etc.

## Default State (chat widget auto-opened, wider, on the right)

```
+-----------------------------------------------------------------------------+
|  Aira                                                  cs.dewi@..   [▾]    |
+----------------------------------------------------+------------------------+
|  Knowledge base (read-only)                        |  Aira                  |
|                                                    |  GROUNDED · 4 sources  |
|  Filename                          Updated         |------------------------|
|  ────────────────────────────────  ────────        |  Hi! I'm Aira. Ask     |
|  qna-aira-next.pdf                 May 23          |  about programs,       |
|  pricing-2026.pdf                  May 25          |  tuition, scholarships,|
|  policies-v2.docx                  May 25          |  hiring outcomes.      |
|  schedule-fall-2026.pdf            May 25          |                        |
|  partners.pdf                      May 25          |                        |
|  ...                                               |  ┌──────────────────┐  |
|                                                    |  │ Ask anything... │  |
|                                                    |  └──────────────────┘  |
|                                                    |                  ▶    |
|                                                    +------------------------+
|                                                    |                  ⌄    |
+----------------------------------------------------+ (minimize chevron)    +
                                                       (right edge, sticky)
```

The chat panel is the **same component** as the public marketing widget, just:
- Auto-opened on page mount (not collapsed to a bubble)
- Wider — roughly 1/3 of viewport instead of the small corner footprint
- Minimizable via the `⌄` chevron at the top-right of the chat panel (collapses to a bubble)
- Re-expandable by clicking the bubble

## Other States

- **Loading documents**: row skeletons in the left list; chat panel renders normally and is usable while the list loads (the chat does its own retrieval).
- **Empty knowledge base**: left list shows "No documents yet — your admin is still curating the corpus" with no CTA (user can't upload). Chat panel still works; assistant will say "I don't have information about that in my knowledge base" until docs land.
- **Chat widget minimized**: collapsed to a floating bubble in the bottom-right corner; left list expands to fill the width. Clicking the bubble re-opens the chat panel.
- **Single-document focus** (future-friendly note, not in scope this phase): clicking a row could one day open a preview pane; for this phase the row is non-interactive aside from cursor feedback.

## Interactions

- Row click → no-op for this phase. Hover shows cursor: default. (Document the future plan in code comment, do not implement.)
- `[▾]` user menu (top-right) → Sign out.
- Chat `⌄` chevron → minimize chat panel to bubble.
- Chat bubble click → expand back to side panel.
- Typing in the chat input + Enter → standard chat submit (existing flow).

## Notes

- This is a brand-new route. Add to FE router as `/workspace`, gated by `RoleGuard("user", "admin", "super_admin")` — any logged-in role can view their own workspace. (Admins land on `/admin` by default, but a direct `/workspace` link should also work for them.)
- The document list comes from `GET /api/documents` — same endpoint admins use. The backend must allow `user` role to call it (read-only) — this is the only admin-doc endpoint the user role can hit.
- Fields exposed to `user`: filename, updated_at. Hide: `chunk_count`, `error_message`, `storage_path` — internal noise. The API response can stay full; FE just doesn't render those columns.
- Rename / delete / reingest / upload actions are absent in this view — no `✏️ 🔄 🗑️` icons.
- Auto-open of chat widget: tracked in localStorage (`workspace_chat_open=true|false`) so the user's preference sticks across sessions; default is open.
