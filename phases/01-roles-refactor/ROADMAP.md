# Phase 01: Implementation Roadmap

Four milestones, ordered by dependency and by what unblocks the client engagement fastest. Each milestone ends in a **shippable state** — the system is never half-broken between milestones. Targeting the 1–2 week deadline with a single implementer.

## Milestone 1: Close the security hole + role infrastructure

**Goal:** the backend actually enforces `user_metadata.role`. No new user-facing features yet, but the foundation for everything else is in place — and the pre-existing "any authenticated user = admin" hole is gone.

**Deliverables:**
- [ ] Backend: `get_current_admin` reads `user_metadata.role` from the verified JWT and rejects roles other than `admin` + `super_admin` with 403.
- [ ] Backend: new `require_role(*roles)` factory dependency that all role-gated endpoints will use going forward.
- [ ] Backend: new `get_current_user_optional` that returns `AuthUser | None` for endpoints that gate on auth (used by chat in M3).
- [ ] Backend: extend the seed script `python -m app.scripts.seed_admin` to create three users (`super_admin`, `admin`, `user`) idempotently, with passwords sourced from `SEED_SUPER_PASSWORD`, `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD` env vars + documented dev fallback.
- [ ] Frontend: extend `useAuthStore` to extract and expose `role` from the Supabase session.
- [ ] Frontend: new `RoleGuard` component (or route wrapper) — used for all role-gated routes from M2 onward.
- [ ] Frontend: `/login` page redirect-by-role logic (super_admin/admin → `/admin`, user → `/workspace`, missing → sign out + error).
- [ ] Add `SEED_*` env var entries to BE `.env.example`. Confirm Railway env has them set before deploying.

**Exit criteria:** All existing admin features still work for a seeded `admin` user. Seeded `user` can sign in but the FE has no `/workspace` route yet (so they hit a 404 — that's expected at this milestone). Running TC-01-001 against seeded super_admin and admin both pass; the `user` half of TC-01-001 will land in M2.

---

## Milestone 2: User chat (the client's primary ask)

**Goal:** a logged-in `user` can sign in, land on `/workspace`, and chat. Super-admin can flip the chat surface to internal-only mode, which gates the public landing widget.

**Deliverables:**
- [ ] Backend: `landing_config.config.chat_mode` read path with `"public"` default; written via the existing `PUT /api/landing-config` (now gated by `require_role("super_admin")`).
- [ ] Backend: chat endpoint accepts optional auth (`get_current_user_optional`); when chat_mode is `"internal"` AND no auth present, return 401.
- [ ] Backend: `GET /api/documents` allows any authenticated role (super_admin / admin / user) to read; write/delete/reingest still require admin+.
- [ ] Frontend: new `/workspace` route with read-only KB list + auto-opened wider chat widget (minimizable, preference in localStorage).
- [ ] Frontend: Landing-config admin page gets the Chat mode toggle (radio Public / Internal) at the top, above brand presets. Single Save for both.
- [ ] Frontend: public landing widget reads `chat_mode` and renders the "Sign in to chat" gate when internal + anonymous.
- [ ] Frontend: super-admin sidebar entry for Landing config; admin sidebar hides it.
- [ ] TC-01-001 (user half), TC-01-002, TC-01-006, TC-01-008 (security gate), TC-01-009 (super_admin gate), TC-01-011 (regression: public chat) executable and passing.

**Exit criteria:** the client can put one seeded `user` in front of Aira and have CS/sales/support reps use it. Anonymous-mode chat still works for everyone else when set to public. **This milestone alone is what unblocks the client engagement** — M3 and M4 are about making it self-serve for the client's team.

---

## Milestone 3: Admin user management

**Goal:** admin and super-admin can grow the team without re-running the seed script.

**Deliverables:**
- [ ] Backend: `POST /api/users` (admin+): creates a Supabase Auth user with email + password + role written to user_metadata. Returns 409 on email collision.
- [ ] Backend: `GET /api/users` (admin+): list users with `id, email, role, status (active|deactivated), created_at`.
- [ ] Backend: `PATCH /api/users/{id}/deactivate` and `PATCH /api/users/{id}/reactivate` (admin+) — flip `banned_until`. Reject self-deactivation server-side for defense-in-depth.
- [ ] Frontend: new `/admin/users` page with list, Add user dialog, Deactivate/Reactivate row actions.
- [ ] Frontend: post-create dialog with one-time password copy affordance.
- [ ] Frontend: sidebar entry "Users" for super_admin and admin.
- [ ] TC-01-005, TC-01-007, TC-01-010 executable and passing.

**Exit criteria:** super-admin or admin can stand up a new CS rep account in <60 seconds without touching the seed script or the Supabase dashboard.

---

## Milestone 4: Knowledge base rename + polish

**Goal:** admin can rename documents; regression and edge-case tests all green; phase is closeout-ready.

**Deliverables:**
- [ ] Backend: `PATCH /api/documents/{id}` (admin+): updates `filename` only. Validates 1–255 chars, trimmed, no path separators. Storage object untouched.
- [ ] Frontend: Rename action icon on each KB row; Rename dialog with optimistic update + revert-on-error.
- [ ] TC-01-003 (rename), TC-01-004 (delete cascade — should already pass; this verifies no regression), TC-01-012 (KB upload regression) executable and passing.
- [ ] All 12 test cases run end-to-end one final time; create a test-run record in `phases/01-roles-refactor/test-runs/`.
- [ ] Update `docs/system-design/README.md` data-model snapshot to mention `chat_mode` in landing_config and the role enforcement.

**Exit criteria:** all 12 test cases pass; the phase is ready to mark complete. Client can deploy.

---

## Critical Path

```
M1 ──► M2 ──► M3
       │
       └────► M4   (M4 only depends on M1, not M2; can be done in parallel with M3 if a second pair of hands shows up)
```

**M1 → M2** is the only hard dependency chain that matters. M3 needs M1 for `require_role`. M4 needs M1 for `require_role`. M3 and M4 are independent and could parallelize.

Single-implementer reality: sequential. With ~10 business days available, rough cut:

- M1: 2 days (mostly backend, well-bounded)
- M2: 3 days (cross-stack; new route + landing widget logic + chat-mode plumbing)
- M3: 2 days (CRUD on top of existing infrastructure)
- M4: 1 day (small, well-scoped)
- Buffer: 2 days (test execution, fix-forward, deploy prep)

= 10 days. Tight but feasible.

## Risks

- **Supabase Admin API quirks during user create/deactivate.** *Likelihood: medium. Impact: medium.* The Admin API has rate limits and occasional latency spikes. Mitigation: the User CRUD endpoints surface Supabase errors verbatim to the FE for fast diagnosis; no swallowing.
- **`user_metadata.role` schema drift across users created outside the seed/UI** (e.g. manually in Supabase dashboard, with a typo). *Likelihood: low. Impact: medium.* Mitigation: backend treats unknown roles as 403; FE Login flow shows "Account misconfigured" and signs them out. Both already in M1.
- **Already-issued JWTs for a just-deactivated user stay valid up to ~1h.** *Likelihood: high (this is a fact, not a risk per se). Impact: low.* Mitigation: documented limitation in MOCKUP + DATA-MODEL; admin endpoints all re-check role on each call. The deactivated user can't do harmful things with a stale token because chat is intentionally open to authenticated roles.
- **Frontend `RoleGuard` not catching every admin route.** *Likelihood: low if implemented as a route wrapper rather than per-page hooks. Impact: high (security regression).* Mitigation: enforce at the router definition level, not per-page; TC-01-008 forces the security check by trying typed URLs.
- **Cascade delete regression.** *Likelihood: very low — it's existing behavior; we're not touching it. Impact: high if it ever breaks.* Mitigation: TC-01-004 will catch any regression; included as a regression test, not as a "verify new code" test.
- **Mid-PR Supabase JWT signing-key rotation.** *Likelihood: low. Impact: high.* Mitigation: the existing JWKS verification path already handles key rotation; no action.
