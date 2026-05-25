# Wireframe: Users page

## Purpose
**New page.** Admin and super_admin manage the internal team's accounts: list, create, deactivate, reactivate. No password reset, no email invitation.

## Default State

```
+-----------------------------------------------------------------------------+
|  Users                                                       [ + Add user ] |
+-----------------------------------------------------------------------------+
|  Email                          Role         Status        Actions          |
|  ────────────────────────────   ──────────   ──────────    ──────────────   |
|  super.boss@airanext.id         super_admin  active        —                |
|  syahiid@airanext.id            admin        active        [ Deactivate ]   |
|  cs.dewi@airanext.id            user         active        [ Deactivate ]   |
|  cs.budi@airanext.id            user         deactivated   [ Reactivate ]   |
|  sales.andi@airanext.id         user         active        [ Deactivate ]   |
+-----------------------------------------------------------------------------+
                                                                  ↑
                                            Own super_admin row: no button
                                            (self-deactivation prevented at UI)
```

## Add user dialog

```
+----------------------------------------------+
|  Add user                                    |
+----------------------------------------------+
|                                              |
|  Email                                       |
|  ┌────────────────────────────────────────┐  |
|  │ cs.newhire@airanext.id                 │  |
|  └────────────────────────────────────────┘  |
|                                              |
|  Password   (8+ characters)                  |
|  ┌────────────────────────────────────────┐  |
|  │ ••••••••••                       👁 📋 │  |
|  └────────────────────────────────────────┘  |
|     (👁 = reveal, 📋 = copy)                 |
|                                              |
|  Role                                        |
|  (●) user           Sales, CS, support, etc. |
|  ( ) admin          Manage KB + users        |
|  ( ) super_admin    Also edits brand & mode  |
|                                              |
|              [ Cancel ]  [ Create user ]     |
+----------------------------------------------+
```

## Post-create confirmation

```
+----------------------------------------------+
|  ✓  cs.newhire@airanext.id created           |
|                                              |
|  Share these credentials with them now —     |
|  this is your only chance to copy the        |
|  password.                                   |
|                                              |
|  Password:  •••••••••                 📋     |
|                                              |
|                          [ Done ]            |
+----------------------------------------------+
```

After clicking Done, the password is wiped from memory and is unrecoverable from the UI.

## Other States

- **Loading list**: skeleton rows.
- **Empty list** (only possible mid-seed): "No users yet. Run the seed script or add one above."
- **Create — email already exists**: server returns 409; inline error in dialog ("This email is already registered. Use Reactivate if the account is deactivated.").
- **Create — password too short**: inline error ("Password must be at least 8 characters.") with Create disabled until valid.
- **Deactivate — current user**: button absent on own row (prevented at UI). No "are you sure" needed for others' rows; the action is reversible via Reactivate.
- **Reactivate**: same button position, opposite verb.

## Interactions

- `[+ Add user]` → open Add user dialog.
- `[Create user]` → `POST /api/users` with `{email, password, role}`. On 200: dialog content swaps to the post-create confirmation. On 4xx: inline error.
- `[Deactivate]` row action → `PATCH /api/users/{id}/deactivate`. Status flips to `deactivated`; button label changes to `Reactivate`. No confirmation dialog (reversible).
- `[Reactivate]` row action → `PATCH /api/users/{id}/reactivate`. Status flips to `active`; button label changes to `Deactivate`.
- Email is non-editable after creation (no edit UI in this phase).

## Notes

- Admin AND super_admin can both create users of any role. (No restriction like "admin can't create super_admin.") This keeps the page simple; abuse mitigation is "only trust people you make admins."
- "Deactivate" maps to setting Supabase Auth's `banned_until` to a far-future date (e.g. 100 years). "Reactivate" clears `banned_until`. Supabase enforces the ban automatically on token refresh.
- Already-issued JWTs for a just-deactivated user stay valid until expiry (~1 hour by default). This is documented as an accepted limitation for this phase; the deactivated user can do nothing harmful with a stale token because all admin endpoints re-check role + status, and chat is intentionally accessible to any authenticated role.
- Pagination not implemented this phase — list is expected to be <50 users. If it ever grows past ~200, add server-side pagination + search.
- All actions on this page require `require_role("admin")` on the backend — both admin and super_admin pass.
