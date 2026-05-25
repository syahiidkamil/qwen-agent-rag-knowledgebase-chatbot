# Wireframe: Admin shell (role-aware sidebar)

## Purpose
Container layout for every admin-side route. Sidebar items show or hide based on the signed-in user's role.

## Default State — `super_admin` view

```
+------------------+-------------------------------------------------+
|  Aira Admin      |  {Current page title}                    [▾]   |
|                  +-------------------------------------------------+
|  📁 Knowledge    |                                                 |
|  👥 Users        |    {Current page content renders here}          |
|  🎨 Landing      |                                                 |
|                  |                                                 |
|                  |                                                 |
|                  |                                                 |
|                  |                                                 |
|  ────────────    |                                                 |
|  super.boss@..   |                                                 |
|  super_admin     |                                                 |
|  [ Sign out ]    |                                                 |
+------------------+-------------------------------------------------+
```

## `admin` view (no Landing item)

```
+------------------+
|  Aira Admin      |
|                  |
|  📁 Knowledge    |
|  👥 Users        |
|                  |  ← no Landing entry
|                  |
|  ────────────    |
|  admin@..        |
|  admin           |
|  [ Sign out ]    |
+------------------+
```

## `user` view — never reaches this shell

If a `user` somehow navigates to `/admin/*` (typed URL, stale link, bookmark), the route guard redirects them to `/workspace`. They do not see the admin shell at all.

## Other States

- **Loading**: sidebar renders skeletons for the role chip while the session resolves; main panel shows a route-level spinner. ~200 ms ceiling.
- **No-network**: sidebar is unchanged; main panel shows the route's own error state.
- **Mid-deactivation by another admin**: next API call returns 401; FE clears the session and bounces to `/login` with a neutral "Your session has ended" inline message.

## Interactions

- Sidebar item click → react-router navigates; active item gets a highlight (existing styling).
- `[Sign out]` → `supabase.auth.signOut`; clears auth store; redirects to `/login`.
- The role chip ("super_admin" / "admin") under the email is read-only — display only, no actions.

## Notes

- Existing admin shell already exists; this wireframe documents the **visibility-by-role** addition (Landing entry shown only to super_admin).
- Role gating is enforced in TWO places: the sidebar render (don't show what you can't use) AND the route guard (the route still 403s if forced). Defense in depth.
- "Aira Admin" wordmark is a future-design concern; current text is fine for this phase.
