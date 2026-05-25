# Wireframe: Login

## Purpose
Single sign-in surface for every role. After successful authentication, redirect by role.

## Default State

```
+----------------------------------------------------------+
|                                                          |
|                    ┌───────────────────┐                 |
|                    │      Aira         │                 |
|                    │   Sign in         │                 |
|                    └───────────────────┘                 |
|                                                          |
|        Email                                             |
|        ┌─────────────────────────────────────┐           |
|        │ you@yourcompany.id                  │           |
|        └─────────────────────────────────────┘           |
|                                                          |
|        Password                                          |
|        ┌─────────────────────────────────────┐           |
|        │ ••••••••••                          │           |
|        └─────────────────────────────────────┘           |
|                                                          |
|                       [    Sign in    ]                  |
|                                                          |
|              (no "forgot password" — out of scope)       |
+----------------------------------------------------------+
```

## Other States

- **Submitting**: button shows spinner, inputs disabled. Same layout, no popover.
- **Auth failed**: red inline error below the password field — "Wrong email or password." No toast, no modal.
- **Account deactivated**: same inline error position — "This account is inactive. Contact your administrator." Sourced from a specific Supabase error code, not a guess.
- **Account misconfigured** (post-sign-in, role missing/unknown): inline error appears AFTER a redirect attempt fails — "This account needs setup. Contact your administrator." The session is cleared automatically.

## Interactions

- `[Sign in]` → `supabase.auth.signInWithPassword`. On success, read `session.user.user_metadata.role` and redirect:
  - `super_admin` or `admin` → `/admin` (lands on Knowledge base by default)
  - `user` → `/workspace`
  - missing / unknown role → sign out, render the "Account misconfigured" error in-place
- Pressing Enter in either field submits.
- Email field auto-focuses on page mount.

## Notes

- Reuses the existing login page DOM; behavior changes are purely in the post-sign-in branch.
- No "forgot password," no "create account," no third-party SSO buttons — all explicitly out of scope.
- The role read happens client-side from the verified JWT, never trusted standalone; every subsequent API request still sends the Bearer token for backend re-verification.
