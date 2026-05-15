# Cleanup, UI Stabilization, and Feature Readiness Roadmap

Branch: `chore/codebase-cleanup-ui-stabilization`

Status: roadmap phase only. No implementation, deletion, or UI rewrites should happen before this file is committed with `docs(roadmap): add cleanup ui stabilization plan`.

## 1. Current Codebase Audit Summary

- Git status was clean before branch creation and clean after the read-only audit.
- The project is already converted to JavaScript and JSX. No tracked `.ts`, `.tsx`, `tsconfig.json`, or `next-env.d.ts` files were found.
- `apps/web/tsconfig.tsbuildinfo` exists locally, is ignored by `.gitignore`, and is safe local generated output.
- Public content still falls back to `apps/web/services/seed-data.js` when no API URL is configured.
- Auth, dashboard, posts, publications, subscribers, settings, uploads, and search have real service wiring, but some flows remain partial or need stronger error handling.
- UI currently uses a top-nav editorial/marketing layout. The provided references point toward a persistent publishing workspace with a left rail, central feed or reader surface, and optional right rail.
- Backend modules are mostly feature-based and separated into routes, controllers, services, repositories, validators, models, middleware, configs, and utils.
- Local env files exist only as ignored local files. Do not read, print, document, or commit their values.

## 2. Unused and Dead Code Cleanup Plan

Removal candidates must be verified with import and usage searches before deletion.

| Candidate                                                                               | Current evidence                                            | Action                                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `apps/server/src/modules/posts/bookmark.model.js`                                       | Model exists, no routes/services/controllers import it.     | Mark risky. Keep until bookmark roadmap is decided, or remove in a dedicated commit if not planned. |
| `countByAuthor` in `post.repository.js`                                                 | Definition has no current caller.                           | Safe small cleanup after one more `rg countByAuthor` check.                                         |
| `requireRole` in `auth.middleware.js`                                                   | Exported but no route uses it.                              | Risky. Keep if role-gated admin features are planned.                                               |
| `refreshSession` in `apps/web/services/auth.js`                                         | Exported but currently unused.                              | Keep and wire into session persistence before considering removal.                                  |
| `draftTitle` and `setDraftTitle` in `ui-slice.js`                                       | Redux command menu state is used, draft title state is not. | Safe targeted cleanup.                                                                              |
| `dashboardMetrics` in `seed-data.js`                                                    | Dashboard no longer imports it.                             | Safe cleanup.                                                                                       |
| `seed-data.js` full file                                                                | Still used as offline fallback in `content.js`.             | Remove only after demo data moves to backend seed flow or fallback policy is changed.               |
| Empty folders such as `apps/web/src` and `apps/web/types`                               | No files found during audit.                                | Safe local cleanup if empty in the working tree.                                                    |
| Generated folders/files: `.next`, `dist`, `tsconfig.tsbuildinfo`, nested `node_modules` | Ignored and not tracked.                                    | Do not commit. Optional local cleanup only.                                                         |

Dependency cleanup candidates:

- `lodash`, `react-loading-skeleton`, and `usehooks-ts` appear unused by source imports.
- Web testing packages are installed but no web tests exist yet; keep if adding tests in this sprint.
- `nodemailer` is unused in source but matches planned email infrastructure; keep unless email abstraction is cut from scope.
- Direct `@types/*` dependencies were not found in package manifests. Transitive lockfile entries are expected.

## 3. Feature Stabilization Plan

Highest priority stabilization slices:

1. Session persistence
   - Use the existing `refreshSession()` helper.
   - Add a controlled 401 refresh retry in the API layer.
   - Verify dashboard survives an expired access token when the refresh token is valid.

2. Protected dashboard behavior
   - Keep the client guard for now.
   - Evaluate a Next middleware/proxy guard only if it works with the cookie and API rewrite setup.
   - Avoid flashing protected dashboard content before auth verification.

3. Editor reopen and edit flow
   - Current editor can create, save, and publish the current draft.
   - Missing: edit button, private post detail endpoint, draft reload route, and existing post editing UI.
   - Add only after API shape is documented and tested.

4. Public content error handling
   - Stop treating API outages as empty states.
   - Distinguish empty API responses from backend/network errors.
   - Keep seed fallback only for explicit offline demo mode.

5. Subscribe and unsubscribe
   - Move subscribe calls into the central publication service.
   - Add unsubscribe support where the UX calls for it.
   - Verify duplicate subscribe, unsubscribe, not-found, and invalid email cases.

6. Publish readiness
   - Prevent publishing posts with invalid or empty required reader content.
   - Decide how scheduled posts should behave before exposing scheduling.

7. Settings
   - Ensure profile and publication settings remain small, understandable forms.
   - Keep upload fields config-based and avoid hardcoded service URLs.

8. Search
   - Current explore search is API-backed.
   - Upgrade command menu search only after shared layout and state patterns are settled.

## 4. UI Alignment Plan

The provided Substack screenshots are visual references only. Sahyogi must keep original branding, original copy, original assets, and its own visual identity.

Target layout language:

- Persistent left navigation rail on desktop.
- Central feed, reader, or workspace content column.
- Optional right rail for recommendations, publication context, account prompts, or dashboard context.
- Compact editorial typography with strong whitespace and high scanability.
- Dark mode must feel intentional, not like inverted light mode.

Page-by-page plan:

- Home: replace the marketing-heavy first screen with a feed-first publishing surface using Sahyogi posts, publications, and recommendations.
- Explore: add topic chips, a stronger central discovery feed, and a right rail for publications or bestsellers.
- Publication detail: add publication logo/cover identity, author context, subscribe module, and publication-specific post feed.
- Post detail: refine reader layout with a narrow editorial measure, publication/author context, actions, and related posts.
- Auth: keep the working form, but make the page feel like Sahyogi onboarding instead of a generic card.
- Dashboard: align to a true app shell with persistent nav, active state, account controls, and responsive mobile navigation.
- Editor: preserve working API flow, then improve focus, sticky controls, save status, preview, and grouped settings.
- Settings: split dense sections into clearer profile, publication, branding, links, and assets areas.
- Subscribers: keep current API-backed list, then add better empty states, lifecycle labels, and filtering.

Shared UI components to create or consolidate later:

- `AppShell`
- `LeftRail`
- `RightRail`
- `FeedLayout`
- `PageHeader`
- `EmptyState`
- `InlineError`
- `LoadingBlock`
- `PostFeedItem`
- `PublicationSummaryCard`

## 5. Seed and Demo Data Plan

Current demo state:

- Frontend seed content lives in `apps/web/services/seed-data.js`.
- It is useful for offline visual fallback, but it should not be the primary demo path for a deployment-ready app.

Planned backend demo seed:

- Add a backend-only `seed:demo` script in a later commit.
- Make it idempotent using stable demo slugs and email placeholders.
- Gate it from production by default.
- Seed:
  - one demo writer
  - one demo publication
  - three to five posts across draft and published states
  - eight to twelve subscribers across active and unsubscribed states
- Use safe placeholder domains and original Sahyogi demo copy.
- Do not commit real credentials, production secrets, or real third-party assets.

## 6. Testing Plan

Relevant checks before roadmap commit:

- `git diff --check`
- `git status --short`

Checks before implementation commits:

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `npm run check` when the slice is broad enough

Backend API test priorities:

- Auth: signup, login, logout, refresh success, refresh replay failure, protected `me`.
- Users: profile patch, empty patch rejection, public profile privacy.
- Publications: public list, detail, create, update, duplicate slug, subscribers, subscribe, unsubscribe.
- Posts: public list/search, publication filter, mine, create, update, publish, unpublish, delete, invalid ObjectId.
- Uploads: unauthorized, missing file, invalid type, successful path with Cloudinary mocked or safely abstracted.
- Dashboard: authenticated counts, empty account, multiple publications.

Frontend/browser verification priorities:

- Home loads.
- Explore loads and search works.
- Login works.
- Signup works.
- Logout works.
- Session persists after refresh.
- Protected dashboard works.
- Dashboard overview loads real API data.
- Create post works.
- Edit existing post works after the edit slice is built.
- Save draft works.
- Publish and unpublish work.
- Delete post works.
- Public post detail works.
- Publication page works.
- Subscribe works.
- Subscriber management loads real data.
- Settings save works.
- 404, loading, empty, error, and toast states work.

## 7. Agent-Wise Task Split

Exactly four agents are used for this sprint.

1. Cleanup and Architecture Agent
   - Owns dead code, duplicate folders, TypeScript leftovers, unused dependencies, and hardcoded runtime cleanup.
   - Must document usage checks before removing anything.

2. UI/UX Agent
   - Owns reference-aligned layout planning and page polish.
   - Must preserve Sahyogi branding and avoid copied Substack assets, logo, text, or content.

3. Feature and API Integration Agent
   - Owns frontend/backend integration gaps, route/service consistency, validation, and error state behavior.
   - Must keep all frontend API calls in central service modules where practical.

4. QA, Seed Data, and Git Agent
   - Owns test/build verification, seed plan, env hygiene, deployment-readiness checks, and commit discipline.
   - Must ensure no secrets are committed or printed.

## 8. Commit Plan

First required commit:

- `docs(roadmap): add cleanup ui stabilization plan`

Suggested next commits:

- `docs(audit): refresh stabilization checklist`
- `chore(cleanup): remove unused ui state fields`
- `chore(cleanup): prune unused package dependencies`
- `chore(config): tighten generated artifact ignores`
- `fix(auth): persist sessions through refresh retry`
- `fix(web): distinguish public api failures from empty states`
- `fix(editor): support editing existing drafts`
- `fix(subscriptions): centralize subscribe and unsubscribe flows`
- `fix(web): align app shell with editorial reference`
- `chore(seed): add demo publishing seed workflow`
- `test(api): split module endpoint coverage`
- `docs(setup): document demo seed and deployment verification`

Each commit must be small, conventional, and verified with the relevant commands.

## 9. Risk List

- Removing seed fallback too early can make local demos look empty when the API is not configured.
- Full Substack-style layout work can become too broad; keep it page-by-page and component-by-component.
- Server-side dashboard protection may conflict with the current cookie and rewrite setup if rushed.
- Upload success tests should avoid real Cloudinary calls unless explicitly configured for local testing.
- Production cookie settings and CORS need careful review before deployment.
- Generated files may reappear after Next builds; keep them ignored and untracked.
- Public post rendering uses sanitized backend HTML, but browser rendering should still be reviewed for XSS-safe assumptions.
- API errors currently vary between Axios client calls and server-side fetch helpers.

## 10. Execution Order

1. Commit this roadmap.
2. Refresh or supersede stale audit/checklist docs.
3. Perform safe cleanup with no behavior changes.
4. Tighten env, ignore, and dependency hygiene.
5. Stabilize auth/session persistence.
6. Stabilize public content error states and seed fallback policy.
7. Stabilize editor edit/reopen flow.
8. Stabilize subscription and subscriber flows.
9. Add backend demo seed workflow.
10. Align the shared app shell and navigation to the reference direction.
11. Align home and explore.
12. Align post and publication pages.
13. Align dashboard, editor, settings, and subscribers.
14. Expand tests and API docs.
15. Run full lint, test, build, browser verification, and deployment-readiness checks.

## 11. Suspected Dead Files and Folders

- `apps/web/src` if still empty at cleanup time.
- `apps/web/types` if still empty at cleanup time.
- `apps/server/src/modules/posts/bookmark.model.js` if bookmark support is not part of near-term scope.
- `apps/web/services/seed-data.js` after backend demo seed or explicit offline demo mode replaces it.
- Generated local artifacts such as `apps/web/.next`, `apps/server/dist`, and `apps/web/tsconfig.tsbuildinfo`.

## 12. APIs and Features Requiring Stabilization

- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `PATCH /api/users/me/profile`
- `GET /api/publications`
- `GET /api/publications/:slug`
- `GET /api/publications/:id/subscribers`
- `POST /api/publications/:slug/subscribe`
- `POST /api/publications/:slug/unsubscribe`
- `GET /api/posts`
- `GET /api/posts/mine`
- Private post detail or edit endpoint, if added
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `POST /api/posts/:id/publish`
- `POST /api/posts/:id/unpublish`
- `DELETE /api/posts/:id`
- `POST /api/uploads/image`
- `GET /api/dashboard`

## 13. Dashboard and Editor Stabilization Checklist

Dashboard:

- [ ] Auth guard does not flash protected content.
- [ ] Session refresh is attempted before redirecting to login.
- [ ] Overview loads real counts.
- [ ] Recent posts load real author data.
- [ ] Empty account state has a clear next action.
- [ ] API errors show clear messages.
- [ ] Mobile layout does not collapse controls or tables.

Editor:

- [ ] Create draft works with validation.
- [ ] Save draft works repeatedly.
- [ ] Publish works only for publish-ready posts.
- [ ] Existing drafts can be reopened and edited.
- [ ] Existing posts can be updated.
- [ ] Cover image upload uses the upload API.
- [ ] Inline images use the upload API.
- [ ] Save/publish status is visible.
- [ ] Errors are shown without losing editor content.
- [ ] No hardcoded external image URLs are introduced.

## 14. Deployment-Readiness Checklist

- [ ] `.env.example` files contain placeholders only.
- [ ] Local env files stay ignored.
- [ ] No secrets appear in tracked docs, code, logs, screenshots, or commits.
- [ ] `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `CLIENT_URL`, `API_PUBLIC_URL`, and cookie settings are documented.
- [ ] Swagger is gated by `ENABLE_SWAGGER`.
- [ ] `TRUST_PROXY` behavior is documented for production.
- [ ] Production localhost fallbacks are reviewed and rejected where needed.
- [ ] `npm run lint` passes.
- [ ] `npm run test:run` passes.
- [ ] `npm run build` passes.
- [ ] Browser smoke checks pass on local dev.
- [ ] README and app-specific READMEs match the final setup.

## 15. Cleanup Verification Strategy

Before deleting or pruning anything:

- Run `rg` for imports/usages.
- Check `git ls-files` to avoid confusing ignored local artifacts with tracked files.
- Check package manifests before dependency removal.
- Keep removals in dedicated commits.
- Run lint after code cleanup.
- Run tests if cleanup touches runtime code.
- Run build after dependency or config cleanup.
- Review `git diff --stat` and `git diff --check`.
- Confirm no `.env` or secret-bearing file is staged.
