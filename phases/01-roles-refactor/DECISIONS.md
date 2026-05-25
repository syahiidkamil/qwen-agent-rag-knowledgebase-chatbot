# Phase 01: Technical Decisions

## Locked (non-negotiable)

- **Three-role hierarchy:** `super_admin` > `admin` > `user`. No additional tiers in this phase.
- **Role source-of-truth:** Supabase Auth `user_metadata.role`. Backend reads it from the verified JWT; no separate `user_roles` table in our Postgres for this phase.
- **Single sign-in surface:** one `/login` page; the FE redirects by role after a successful sign-in (admins → admin surface; users → internal chat surface).
- **Seed script invocation:** `python -m app.scripts.seed_admin`. The existing script is extended to seed all three roles; no `npm run seed` proxy in the FE.
- **Chat-mode flip is passive:** when super-admin switches to internal, in-flight anonymous chats are not actively terminated — the next request just receives 401, and a refresh shows the sign-in prompt. No session-state tracking.
- **Self-deactivation is blocked at the UI:** the Deactivate control is hidden on a super-admin's own row. No backend rule needed (defense-in-depth can come later).
- **Cascade delete stays as-is:** the existing `ON DELETE CASCADE` on `chunks.document_id` + ORM cascade already handle vector cleanup on document deletion. Do not change.
- **Rename mutates `documents.filename` only.** The storage object path is immutable; Supabase Storage does not support cheap rename and we do not want to refetch + reupload.
- **`chat_mode` lives inside the existing `landing_config.config` JSONB.** New key, not a new column. No migration.
- **Out of scope (locked):** password reset, email invitations, role editing after creation, audit log, multi-tenancy, per-document permissions, user self-registration.
- **Pre-existing security hole is closed in this phase, not deferred.** The current `get_current_admin` accepts any authenticated user — that is the first thing the refactor fixes, before any new user-role traffic exists.

## Flexible (ATLAS discretion at implementation time)

- **Exact backend dependency naming.** `require_role("admin")` factory, `RequiresRole` class, or per-role dependencies (`get_current_admin`, `get_current_super_admin`, `get_current_user`) — judgment call. Aim: minimal duplication, readable at the route definition.
- **How the FE auth store exposes role.** A single `role: 'super_admin' | 'admin' | 'user' | null` field on the existing `useAuthStore` is the obvious shape; convenience selectors / hooks (`useIsAdmin`, `useIsSuperAdmin`) are at implementer's discretion.
- **`RoleGuard` shape.** A wrapper component, a higher-order route, or a hook inside `ProtectedRoute` — all viable. Pick the one that reads cleanly in `router.tsx`.
- **Users page UX details.** Modal vs side-drawer for the Create User form; inline vs row-action menu for Deactivate. Match the existing admin-page style if there is one.
- **`landing_config.chat_mode` default.** When the row is missing the key, treat it as `"public"` for backwards-compatibility with existing deployments.
- **Token-revocation behavior on deactivate.** Wait-for-next-request (cheap, simple) versus immediate revocation via Supabase admin API. Recommend wait-for-next-request unless this phase's testing surfaces a real abuse vector.
- **"Account misconfigured" copy.** Wording is the implementer's call; should be neutral and direct (e.g. "This account needs setup. Contact your administrator.") rather than blaming the user.
- **Whether to add an admin-side "currently: public/internal" preview chip** near the chat-mode toggle. Small UX win; defer if time is tight.

## Open Questions (resolve during implementation)

- **Internal chat surface route.** `/chat`, `/internal`, `/cs`, or stay on `/` with the widget docked? Likely `/chat` for clarity, but confirm against the existing FE route conventions before coding.
- **Does the user role see the chat widget chrome that anonymous visitors see (the Aira intro card, sources panel), or a tighter "CS console" layout?** Recommend same chrome for this phase — saves design work and keeps the surface area small. Revisit when CS feedback comes in.
- **Should creating a new user trigger any kind of welcome to the admin UI** (toast confirming creation, success modal with credentials to copy)? Recommend a toast plus a one-time "copy password" affordance in the create dialog, since there is no email invitation in this phase.
- **`SEED_*_PASSWORD` env vars: where do they live in `.env.example`?** Add to the BE's `.env.example` so new clones know they exist; do not commit real values. Confirm Railway env has them set before deploying this phase.
