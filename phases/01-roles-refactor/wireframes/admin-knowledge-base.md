# Wireframe: Knowledge base (admin view, with Rename)

## Purpose
Existing admin page. This phase adds a **Rename** action per row; nothing else changes structurally.

## Default State

```
+-------------------------------------------------------------------+
|  Knowledge base                                  [ + Upload file ]|
+-------------------------------------------------------------------+
|  Filename                  Status      Chunks   Uploaded   Actions|
|  ────────────────────────  ─────────   ──────   ────────   ───────|
|  qna-aira-next.pdf         ingested    48       May 23     ✏️ 🔄 🗑️|
|  pricing-2026.pdf          ingesting   —        May 25     🔄    |
|  faq-broken.pdf            failed (?)  —        May 24     🔄 🗑️ |
|  policies-v2.docx          uploaded    —        May 25     🔄    |
+-------------------------------------------------------------------+

Action icons:    ✏️ = Rename (NEW)
                 🔄 = Reingest (existing)
                 🗑️ = Delete (existing — cascades to chunks)
```

## Rename dialog (NEW)

```
+----------------------------------------------+
|  Rename file                                 |
+----------------------------------------------+
|                                              |
|  Filename                                    |
|  ┌────────────────────────────────────────┐  |
|  │ qna-aira-next.pdf                      │  |
|  └────────────────────────────────────────┘  |
|                                              |
|  Source-chip labels on future answers        |
|  will use the new name. The underlying       |
|  file in storage is not renamed.             |
|                                              |
|              [ Cancel ]  [ Save name ]       |
+----------------------------------------------+
```

## Other States

- **Loading list**: row skeletons for ~3 rows while the GET completes.
- **Empty list**: friendly empty-state — "No documents yet. Upload your first file to get started." with an upload CTA.
- **Failed row**: status reads `failed` with a tooltip on hover showing the `error_message`. Retry icon visible.
- **Renaming row (optimistic)**: row name updates immediately on save; if the PATCH fails, revert and show toast.
- **Rename validation error**: inline error below the field — "Filename cannot be empty." Save disabled until valid.

## Interactions

- `[+ Upload file]` → existing upload flow (no change).
- `✏️` row action → open Rename dialog pre-filled with current filename.
- Rename dialog `[Save name]` → `PATCH /api/documents/{id}` with `{filename: "..."}`; close dialog; row updates.
- Rename dialog `[Cancel]` or ESC → close, no change.
- `🔄` and `🗑️` → existing flows, no change.

## Notes

- `user` role never sees this page (route guard).
- Rename is admin and super_admin only (`require_role("admin")` on the new PATCH endpoint).
- Filename validation: 1–255 chars, no leading/trailing whitespace, no path separators. Reject silently on the FE with the inline error.
- Deliberately NOT changing: the storage object path, the document ID, the chunk content. Only the displayed label.
- Source chips on previously-rendered chat turns are NOT retroactively updated (they came in the SSE payload at the time). New chat answers will use the new label.
