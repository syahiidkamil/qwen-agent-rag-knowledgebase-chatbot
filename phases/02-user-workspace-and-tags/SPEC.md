# Phase 02 — User workspace shell + KB tags + collapsible sidebar

## Context

Phase 01 closed with a single-page `/workspace` that mashed a read-only knowledge-base list and an auto-opened chat widget onto the user role's only surface. Cramped, hard to navigate, hard to extend.

Phase 02 splits that page into a proper two-page workspace shell mirroring the admin shell, makes both shells' sidebars collapsible, and adds tags to KB documents so the user surface can filter the corpus.

## Outcome

A signed-in `user` lands on **`/workspace/ai-help`** by default — a full-page chat surface with the existing ChatPanel expanded to fill the content area. The **Knowledge base** menu entry (second in the workspace sidebar) renders a read-only KB list with tag chips and a top-bar OR-multi-select tag filter (lexical, exact tag match).

Admins gain a Tags column on `/admin/knowledge` and a tag chip-input inside what was previously the Rename dialog — now "Edit document" — that handles both filename and tags via one PATCH call.

Sidebar collapse applies to both the admin and workspace shells; state persists per-device under `localStorage["aira:ui:sidebar_collapsed"]`.

## Scope

- **Backend**:
  - Migration `0002_documents_tags.py` adds `documents.tags JSONB NOT NULL DEFAULT '[]'`.
  - `PATCH /api/documents/{id}` now accepts optional `filename` and optional `tags`; both validated server-side. `INVALID_TAGS` 400 surfaces back through the FE inline error path.
  - Pydantic: `DocumentRenameIn` → `DocumentUpdateIn` (both fields optional).
- **Frontend**:
  - New workspace shell (`WorkspaceLayout`, `WorkspaceSidebar`, `WorkspaceTopBar`, `AiHelpPage`, `UserKnowledgePage`). Old `WorkspacePage.tsx` deleted.
  - Router: nested routes under `/workspace`; `/workspace` → `/workspace/ai-help`. `defaultRouteForRole("user")` updated.
  - `useUiStore` for shared sidebar-collapsed state; both `AdminSidebar` and `WorkspaceSidebar` consume it.
  - `ChatPanel` gains a `fullPage` prop that drops the dialog dimensions and centers the message column at a 720px max-width.
  - `RenameDialog` → `EditDocumentDialog` with filename + tag chip-input. Backspace on empty input pops last chip; Enter or comma adds.
  - `FilesTable` gains a Tags column.
  - `KbFile` / `BackendDoc` / `DocumentService` / `useFilesStore` extended for tags. `rename` → `update(id, patch)` with optimistic update + revert-on-error.
- **Docs**: this file + `docs/system-design/README.md` (data model already updated in Phase 01 closeout for `chat_mode`; tags are documented here only since they're a Phase 02 addition).
- **Closeout**: this SPEC + `test-runs/2026-05-25-exit.md` for the verification run.

## Out of scope

- Tag-filtered retrieval at the chat layer (tags are display-only on the KB browser).
- Tag autocomplete, color, or rename-across-docs.
- Predefined tag vocabulary or admin-managed tag CRUD.
- Sidebar collapse animation niceties beyond the CSS transition.
- Sub-string / fuzzy search on tags (only exact-tag OR filter).

## Critical files

**BE (new):** `app/alembic/versions/0002_documents_tags.py`
**BE (modified):** `app/models/document.py` · `app/schemas/document.py` · `app/api/documents.py`

**FE (new):**
- `src/features/workspace/{WorkspaceLayout,WorkspaceSidebar,WorkspaceTopBar,AiHelpPage,UserKnowledgePage}.tsx`
- `src/stores/useUiStore.ts`
- `src/features/admin/knowledge/EditDocumentDialog.tsx`

**FE (modified):**
- `src/routes/router.tsx` · `src/routes/RoleGuard.tsx`
- `src/features/admin/AdminSidebar.tsx` · `src/features/admin/AdminLayout.tsx` · `src/features/admin/AdminTopBar.tsx`
- `src/components/chatbot/ChatPanel.tsx`
- `src/services/DocumentService.ts` · `src/stores/useFilesStore.ts` · `src/types/file.ts`
- `src/features/admin/knowledge/FilesTable.tsx`
- `src/index.css`

**FE (deleted):** `src/features/workspace/WorkspacePage.tsx` · `src/features/admin/knowledge/RenameDialog.tsx`

## Test cases

- [TC-02-001](test-cases/TC-02-001.md) — User browses the KB and filters by tag (OR, exact, case-folded)
- [TC-02-002](test-cases/TC-02-002.md) — Admin tags a document via the Edit document dialog
- [TC-02-003](test-cases/TC-02-003.md) — Invalid tag inputs surface inline without dismissing the dialog
- [TC-02-004](test-cases/TC-02-004.md) — Sidebar collapse persists across reloads and both shells

[TC-01-003](../01-roles-refactor/test-cases/TC-01-003.md) was also updated in this phase to reflect the Rename action → Edit document dialog rename; the filename-rename happy path remains valid.

## Test-run record

See [`test-runs/2026-05-25-exit.md`](test-runs/2026-05-25-exit.md).
