# OrangeHRM QA Automation Framework — Project State

> Manual section. Human-maintained — not touched by `npm run docs:state`.
> The auto-generated file tree lives below this section; regenerate it with
> `npm run docs:refresh` after adding/removing files.

---

## What This Project Is

An AI-assisted, production-grade QA automation framework built against
OrangeHRM (open-source HR app: UI + REST API + MySQL). Playwright + TypeScript.
Three test layers — Integration (API/DB only), System (UI + API/DB combined),
E2E (full user journeys) — each testing the same features from a different angle.

Three AI agents assist the pipeline:
- **Planner** (`agents/planner/`) — reads a feature/issue, produces a structured test plan.
- **Generator** (`agents/generator/`) — reads the plan + ground truth, writes spec files.
- **Healer** (`agents/healer/`) — reads failed test reports, rewrites specs to fix them.

All three call Gemini 2.5 Flash via `agents/shared/gemini-client.ts` (rate-limited to
9 RPM for the free tier).

---

## Why Things Are Built the Way They Are

### Cookie-based auth, not OAuth2 client flow
OrangeHRM only implements OAuth2 Authorization Code flow (no password grant, no
client_credentials) — unusable for headless test automation. Instead: log in
once via UI, capture the `_orangehrm` session cookie via Playwright's
`storageState()`, inject it into `APIRequestContext` for API-layer tests.

### Ground truth extracted from the running system, not written by hand
OrangeHRM ships with zero API documentation (no Swagger, no OpenAPI spec).
`scripts/extract-context.ts` pulls DB schema directly from MySQL
`INFORMATION_SCHEMA`, and API contracts directly from PHP `@OA\*` annotations
in the running container. This produces `src/context/db-schema.md` and
`src/context/api-contracts.md` — regenerated on demand, always in sync with
the actual app, never hand-maintained. Currently covers all 19 plugins /
~480 endpoints, not just PIM.

`src/context/known-behaviors.md` is the one context file that's manually
maintained — it captures quirks no schema/contract extraction can reveal
(e.g. "this field is nullable but the UI never lets it be empty in practice").
It grows only as new modules get tested; it cannot be front-loaded.

### Why the healer needed a debugging methodology, not just more context
Early in PIM/Employee testing, healer passes correctly reasoned through
several real bug classes — see "Known Bug Classes" below — but consistently
missed one category: bugs where the AI-authored code was syntactically and
logically plausible but pointed at the wrong DOM element. No amount of
failure-report context caught this; it required a human running `--debug`
and watching the browser. This is now a standing principle for this project
(see "Operating Principles").

---

## Current Status (as of 2026-07-10)

| Layer       | Module                                                                                 | Status                                                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration | Pim/Employee                                                                           | ✅ 7/7 passing                                                                                                                                                                                                                                        |
| System      | Pim/Employee                                                                           | ✅ passing (Create, Read, Delete). **Update (PIM-U-001/002) skipped** — current POMs have no method to reach/edit an employee's profile page fields (nationality, marital status, DOB). Needs new page object methods before these can be un-skipped. |
| E2E         | Pim/Employee, smoke, hire-to-leave                                                     | 🚧 exists, not yet verified against current fixture/page-object state — needs a fresh run before trusting it                                                                                                                                          |
| Integration | Leave/Assign                                                                           | ❌ file exists but empty (`// TODO`) — no real coverage                                                                                                                                                                                               |
| System      | Leave                                                                                  | ❌ not started. `LeaveListPage` has partial methods (`expectLeaveVisible`, `expectNoRecords`, now `expectRecordCount`); `AssignLeavePage` is an empty stub                                                                                            |  |
| —           | Admin, Time, Attendance, Recruitment, Performance, Buzz, Claim, Dashboard, Maintenance | ❌ not started (context/ground-truth already covers their API contracts + DB schema; only spec files are missing)                                                                                                                                     |

**Action before Sprint 1 kicks off:** review the existing Leave files
(`leave-assign.page.ts`, `leave-list.page.ts`, `leave.factory.ts`,
`leave-assign.integration.spec.ts`) to determine what's actually implemented
vs. scaffolded-but-empty, so Sprint 1 scope reflects "finish" rather than
"start from zero."

---

## Known Bug Classes (Healer's Accumulated Lessons)

Full detail lives in `agents/healer/prompt.ts` under "KNOWN ISSUES." Summary:

1. Playwright/POM fixtures must use `authenticatedPage`, not the raw unauthenticated `page`.
2. API paths must be full paths (`/web/index.php/api/v2/...`), not short (`/api/v2/...`).
3. OrangeHRM returns `200` for all successful operations — never 201/204.
4. DB column names diverge from API field names (see mapping table in `known-behaviors.md`).
5. OrangeHRM uses custom Vue modals, never native browser `dialog` events.
6. `AddEmployeePage.save()` has its own internal `waitForResponse` — bypass it
   when an external interceptor is already capturing the same request (race condition otherwise).
7. Employee Name search is a typeahead component — `.fill()` alone doesn't
   commit the value to its internal model; must simulate real keystrokes and
   move focus off the field (not `Escape`, which cancels rather than commits).
8. DOM-dependent counts (e.g. table row counts) must use Playwright's
   auto-retrying `expect(locator).toHaveCount()`, never a one-shot `.count()`
   compared with `toBe()` — the latter races against client-side re-render
   and passes in `--debug` while flaking headless.
9. "No Records Found" renders in two places at once (table span + toast) —
   scope locators to `span.oxd-text--span`, not a page-wide `getByText`.
10. GET-by-empNumber-filter returns `422`, not `200` + empty array, once
    that employee has been deleted — don't assume REST-conventional empty-list behavior.
11. **The one class no AI reasoning caught on its own:** a correctly-reasoning
    healer can still generate a locator that points at the wrong input field
    entirely. This doesn't surface as a logic bug — it surfaces as a
    consistently-wrong result that looks like dirty data, timing, or a stale
    counter. The only reliable way to catch it: run the test in `--debug` and
    watch it type.
12. **Playwright fixtures inject `baseURL` automatically; standalone scripts
    (globalSetup-style, outside test context) don't get this for free.**
    Any `browser.newContext()` created manually must explicitly pass
    `{ baseURL: config.baseUrl }`, or relative `page.goto()` calls fail
    with "Cannot navigate to invalid URL."

---

## Operating Principles

- **SOLID, applied concretely:**
  - *S* — one Page Object per screen; utils split by concern (`api/`, `db/`, `ui/`).
  - *O* — new modules extend `BasePage`, never modify it.
  - *L* — any `BasePage` override (e.g. custom `waitForPageReady()`) must keep the same signature/contract.
  - *I* — utils expose narrow methods (`getRaw` separate from `get`) added on demand, not speculative "just in case" surface area.
  - *D* — tests consume `authenticatedPage`/`authenticatedApi`/`db` via fixtures; no test constructs its own auth/connection.
- **Never trust a green diff from an AI agent without running it.** Structurally
  correct ≠ semantically correct — this is the whole reason `known-behaviors.md` exists.
- **When a test passes in `--debug` but fails headless, suspect a race
  condition or a genuinely wrong locator before suspecting flaky infrastructure.**
- **Extend context/ground-truth before writing new specs for a module**, never after.
- **One next action, not five.** Each work session should end with exactly
  one clear "what's next" — avoid parallel half-finished threads across modules.

---

## Roadmap (see full sprint plan below for dates)

1. ~~Pim/Employee~~ ✅ (Update flow intentionally deferred — needs new POM methods)
2. Leave (Create/Approve/Reject/Cancel workflow) — **in progress, scope pending file review**
3. Admin — User Management subset
4. Time & Attendance
5. Recruitment
6. Performance
7. Backlog (opportunistic): Buzz, Claim, Dashboard, Maintenance, remaining Admin sub-areas

<!-- AUTO-GENERATED:START -->

## File Tree & Purpose

> Regenerated by `npm run docs:state` — do not edit by hand.

| File                                                       | Purpose                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| `config/env.ts`                                            | —                                                          |
| `context/api-contracts.md`                                 | —                                                          |
| `context/db-schema.md`                                     | —                                                          |
| `context/known-behaviors.md`                               | —                                                          |
| `data/employees.ts`                                        | —                                                          |
| `data/factories/employee.factory.ts`                       | Test data factory                                          |
| `data/factories/leave.factory.ts`                          | Test data factory                                          |
| `data/users.ts`                                            | —                                                          |
| `fixtures/api.fixture.ts`                                  | Playwright fixture — dependency injection for tests        |
| `fixtures/auth.fixture.ts`                                 | Playwright fixture — dependency injection for tests        |
| `fixtures/base.fixture.ts`                                 | Playwright fixture — dependency injection for tests        |
| `fixtures/db.fixture.ts`                                   | Playwright fixture — dependency injection for tests        |
| `fixtures/index.ts`                                        | —                                                          |
| `fixtures/pom.fixture.ts`                                  | Playwright fixture — dependency injection for tests        |
| `pages/admin/admin.page.ts`                                | Page Object — encapsulates locators/actions for one screen |
| `pages/base.page.ts`                                       | Page Object — encapsulates locators/actions for one screen |
| `pages/dashboard.page.ts`                                  | Page Object — encapsulates locators/actions for one screen |
| `pages/employee/add-employee.page.ts`                      | Page Object — encapsulates locators/actions for one screen |
| `pages/employee/employee-list.page.ts`                     | Page Object — encapsulates locators/actions for one screen |
| `pages/leave/assign-leave.page.ts`                         | Page Object — encapsulates locators/actions for one screen |
| `pages/leave/leave-list.page.ts`                           | Page Object — encapsulates locators/actions for one screen |
| `pages/login.page.ts`                                      | Page Object — encapsulates locators/actions for one screen |
| `types/api.types.ts`                                       | Shared TypeScript types/interfaces                         |
| `types/db.types.ts`                                        | Shared TypeScript types/interfaces                         |
| `types/env.types.ts`                                       | Shared TypeScript types/interfaces                         |
| `utils/api/interceptor.util.ts`                            | Utility class — shared logic (API, DB, etc.)               |
| `utils/api/request.util.ts`                                | Utility class — shared logic (API, DB, etc.)               |
| `utils/api/response.util.ts`                               | Utility class — shared logic (API, DB, etc.)               |
| `utils/db/assertion.util.ts`                               | Utility class — shared logic (API, DB, etc.)               |
| `utils/db/query.util.ts`                                   | Utility class — shared logic (API, DB, etc.)               |
| `utils/db/seed.util.ts`                                    | Utility class — shared logic (API, DB, etc.)               |
| `utils/ui/assertion.util.ts`                               | Utility class — shared logic (API, DB, etc.)               |
| `utils/ui/screenshot.util.ts`                              | Utility class — shared logic (API, DB, etc.)               |
| `utils/ui/selector.util.ts`                                | Utility class — shared logic (API, DB, etc.)               |
| `utils/ui/wait.util.ts`                                    | Utility class — shared logic (API, DB, etc.)               |
| `e2e/critical-journeys/hire-to-leave.e2e.spec.ts`          | Test spec                                                  |
| `e2e/pim/employee.e2e.spec.ts`                             | Test spec                                                  |
| `e2e/smoke/smoke.e2e.spec.ts`                              | Test spec                                                  |
| `integration/employee/employee-create.integration.spec.ts` | Test spec                                                  |
| `integration/leave/leave-assign.integration.spec.ts`       | Test spec                                                  |
| `integration/pim/employee.api.spec.ts`                     | Test spec                                                  |
| `system/auth/login.system.spec.ts`                         | Test spec                                                  |
| `system/employee/add-employee.system.spec.ts`              | Test spec                                                  |
| `system/pim/employee.spec.bak.ts`                          | —                                                          |
| `system/pim/employee.spec.ts`                              | Test spec                                                  |
| `generator/index.ts`                                       | —                                                          |
| `generator/prompt.ts`                                      | —                                                          |
| `generator/types.ts`                                       | —                                                          |
| `healer/index.ts`                                          | —                                                          |
| `healer/prompt.ts`                                         | —                                                          |
| `healer/types.ts`                                          | —                                                          |
| `planner/index.ts`                                         | —                                                          |
| `planner/prompt.ts`                                        | —                                                          |
| `shared/gemini-client.ts`                                  | —                                                          |
| `shared/rate-limiter.ts`                                   | —                                                          |
| `shared/types.ts`                                          | —                                                          |

<!-- AUTO-GENERATED:END -->
