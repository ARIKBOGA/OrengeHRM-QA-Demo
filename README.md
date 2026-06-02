# OrangeHRM QA Framework

> Multi-environment, agentic QA automation framework for OrangeHRM.
> Playwright + TypeScript · MySQL · Gemini AI · GitHub Actions · Allure

## Stack

| Layer        | Tool                          |
|--------------|-------------------------------|
| Test runner  | Playwright + TypeScript       |
| Reporting    | Allure for Playwright         |
| AI agents    | Gemini 2.5 Flash (free API)   |
| CI/CD        | GitHub Actions                |
| Tracking     | GitHub Issues + Projects      |
| App          | OrangeHRM (Docker local)      |
| DB           | MySQL 8.0 via mysql2          |

## Environments

| Command              | Environment         | DB  |
|----------------------|---------------------|-----|
| `npm run test:local` | Local Docker (QA)   | ✅  |
| `npm run test:staging` | Public demo (Staging) | ❌ |

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_USER/orangehrm-qa
cd orangehrm-qa
npm install
npx playwright install chromium

# 2. Start OrangeHRM locally
npm run docker:up
# Wait ~60s for first boot, then visit http://localhost:8080

# 3. Complete OrangeHRM web installer
# http://localhost:8080 → follow setup wizard
# Default DB: host=db, user=orangehrm, pass=orangehrm, db=orangehrm

# 4. Run tests
npm run test:local    # full suite, local Docker
npm run test:staging  # smoke only against public demo

# 5. Open report
npm run report
```

## Test Layers

| Layer       | Command                    | Scope                          |
|-------------|----------------------------|--------------------------------|
| Integration | `npm run test:integration` | API ↔ DB, no UI                |
| System      | `npm run test:system`      | UI + API interception          |
| E2E         | `npm run test:e2e`         | Full critical user journeys    |
| Smoke       | `npm run test:smoke`       | App up + login works           |

## AI Agents

```bash
npm run agent:plan     -- --issue 42   # GitHub Issue → test plan
npm run agent:generate -- --plan reports/test-plans/issue-42-test-plan.md
npm run agent:heal     -- --spec tests/system/auth/login.system.spec.ts
```

## Architecture

- `src/fixtures/`  — shared state (auth, API context, DB connection)
- `src/pages/`     — Page Object Model (POM)
- `src/utils/`     — UI, API, DB utility classes
- `agents/`        — Gemini-powered AI agents
