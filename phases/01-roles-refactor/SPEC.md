# Phase 01: roles-refactor

## Objective

Pivot Aira from a public marketing chatbot into an internal customer-service tool. Customer-service reps sign in, ask the AI grounded questions about the knowledge base, and relay the answers to real customers. Admins curate the knowledge base. A super-admin owns brand presets and can flip the chat back to public mode when the use case calls for it. This phase also closes a pre-existing security hole — today *any* authenticated user is treated as admin — and introduces a three-role hierarchy that gates every privileged surface accordingly. The client engagement starting this week depends on internal-only chat being available.

## Deliverables

User-observable outcomes (not files, libraries, or schemas):

1. **Three roles work end-to-end.** Logging in as `super_admin`, `admin`, or `user` lands the person on the correct screen and grants only the permissions appropriate to their role.
2. **CS reps can sign in and chat.** A `user` arriving at the app can log in and use the chat widget; they cannot see or reach any admin surface.
3. **Admins can manage the knowledge base fully.** Upload, list, rename, and delete documents — with deletion removing every associated chunk from the vector store (no orphan rows).
4. **Admins can manage the internal team's accounts.** A Users page lists everyone, lets admins create new users with a role assignment, and deactivate or reactivate accounts.
5. **Super-admin owns brand presets and the chat surface mode.** Only super-admin can edit the landing-page brand config or flip the chat widget between public and internal modes.
6. **Internal-mode gating works on the public landing page.** When chat mode is `internal`, anonymous visitors see a "Sign in to chat" prompt instead of the chat widget. Logged-in users (any role) chat normally. When chat mode is `public`, anyone can chat — the current behavior is preserved.
7. **The seed script bootstraps all three roles.** A single command creates a super-admin, an admin, and a user account, idempotently, with passwords sourced from environment variables.

## Out of Scope

- Password reset (self-service or admin-driven)
- Email invitations or magic links
- Role changes after account creation (to change a role, the admin deactivates and recreates)
- Multi-tenant separation (single tenant for now)
- User self-registration / public sign-up
- Audit log of admin actions
- Per-document permissions (all KB files are visible to every admin and super-admin)
- Separate `/admin/login` page (the single `/login` redirects by role)
- Graceful mid-conversation transition for anonymous chats when chat mode flips to internal (next request is blocked, refresh shows the sign-in prompt — this is deliberate)

## Dependencies

- **Requires:** the existing Supabase Auth integration with ES256 JWKS verification; the existing `landing_config` JSONB blob; the existing seed-admin script as a starting point.
- **Enables:** later phases for password reset / email invitation flows, per-document permissions, audit logging, multi-tenant separation, and in-place role editing.

## Acceptance Criteria

All must be true for this phase to be complete. Each is observable behavior or system state, not an implementation step.

1. The seed script, run against a fresh database, creates exactly one user with each of the three roles, sourced from `SEED_SUPER_PASSWORD`, `SEED_ADMIN_PASSWORD`, and `SEED_USER_PASSWORD` env vars (with a documented dev fallback when unset).
2. After signing in at `/login`, a super-admin or admin lands on the admin surface; a user lands on the internal chat surface; an account whose role is missing or unrecognized sees a clear "account misconfigured" error and is signed out.
3. The Users page is visible to super-admin and admin, hidden from user. The Landing-config page and Chat-mode toggle are visible only to super-admin.
4. A signed-in user cannot reach any document, user-management, or landing-config endpoint — direct API calls return 403. Browsing to admin URLs in the FE redirects them to the internal chat surface.
5. An admin can rename a document. The new filename appears immediately in the documents list and as the source-chip label on subsequent chat answers. The underlying storage object is not renamed.
6. Deleting a document via the admin UI removes it from the documents list AND removes every chunk row for that document from the database. The chunk count for that document is zero post-delete.
7. The Users page lets admin and super-admin: create a new user with email + password + role; deactivate an active user; reactivate a deactivated user. A deactivated user cannot sign in.
8. A super-admin cannot deactivate their own account from the UI (the Deactivate control is absent on their own row).
9. When chat mode is `internal`: the landing-page chat widget shows the "Sign in to chat" prompt to anonymous visitors; the chat endpoint returns 401 for unauthenticated requests; any authenticated role can chat.
10. When chat mode is `public`: anonymous visitors see and use the chat widget as before; authenticated users can also chat. Backwards-compatible with current behavior.
11. The pre-existing security hole is closed: the authenticated-admin dependency now enforces the role field on the verified JWT and rejects unauthorized roles with 403.
