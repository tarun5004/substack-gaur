# Feature Stabilization And Deployment Readiness Checklist

Historical branch: `fix/feature-stabilization-deployment-ready`

Current cleanup branch: `chore/codebase-cleanup-ui-stabilization`

This checklist records what the previous stabilization branch fixed and what still
needs attention. The active execution plan now lives in
`docs/cleanup-ui-stabilization-roadmap.md`.

## Ground Rules

- Real credentials stay only in local `.env` files.
- Do not commit `.env`, `.env.local`, `apps/server/.env`, or
  `apps/web/.env.local`.
- `.env.example` files must use placeholders or safe local examples only.
- Keep API access behind shared config and service helpers.
- Keep backend modules separated by route, controller, service, repository,
  model, validation, middleware, config, and utils.

## Completed Stabilization Work

- The workspace was converted to JavaScript and JSX.
- Server tests now run with Vitest.
- Local env files are ignored explicitly.
- Web API URL handling is centralized through `api-config.js`.
- Dashboard overview uses `/api/dashboard` and `/api/posts/mine`.
- Dashboard post management can publish, unpublish, and delete posts.
- Editor save draft and publish actions use the posts API.
- Image upload uses the protected upload API instead of fixed external image
  URLs.
- Profile and publication settings save through real APIs.
- Subscriber management loads real subscribers from the publication API.
- Auth forms surface validation and API errors.
- Explore search uses the posts API.
- Deployment documentation was expanded for local and production setup.

## Remaining Stabilization Work

### P0: Cleanup And Source Of Truth

- Remove or keep documented dead-code candidates only after usage checks.
- Decide whether frontend seed fallback stays as explicit offline demo mode or
  moves fully to backend demo seeding.
- Refresh stale API contract documentation after route changes.
- Split oversized backend test coverage into module-focused suites.

### P1: Auth And Session UX

- Wire `refreshSession()` into the frontend API flow.
- Attempt refresh before redirecting protected dashboard routes to login.
- Verify logout clears UI state and protected routes after browser refresh.
- Consider server-side or middleware-based route protection only after cookie and
  rewrite behavior is verified.

### P1: Editor And Posts

- Add a reliable edit/reopen flow for existing drafts and posts.
- Add private post detail support if needed by the editor.
- Validate publish readiness so empty reader content cannot go live.
- Decide whether `archived` and `scheduled` post states stay hidden or become
  supported flows.

### P1: Reader And Subscription Flows

- Distinguish API failures from real empty public post and publication lists.
- Move public subscribe/unsubscribe calls through a central publication service.
- Add unsubscribe UI only where the product flow needs it.
- Add pagination or cursor support for subscriber-heavy accounts.

### P2: Deployment Readiness

- Reject localhost production values where practical.
- Document `TRUST_PROXY`, `ENABLE_SWAGGER`, `API_PUBLIC_URL`, and cookie
  expectations for production.
- Run audit commands in a trusted environment before deployment.
- Add browser smoke checks for home, explore, auth, dashboard, editor,
  publication, post detail, subscribe, 404, and error states.

## Current Recommended Order

1. Commit the cleanup and UI stabilization roadmap.
2. Refresh stale docs and audit notes.
3. Perform safe cleanup with no behavior changes.
4. Stabilize session persistence.
5. Stabilize public API error states.
6. Build edit/reopen draft flow.
7. Centralize subscribe and unsubscribe services.
8. Add backend demo seed workflow.
9. Align UI pages with the provided editorial workspace references.
10. Expand tests and run final deployment-readiness verification.
