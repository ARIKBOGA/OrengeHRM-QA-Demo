## OrangeHRM Known Behaviors

> Manually maintained. Not touched by `npm run context:extract`.
> Add a new entry here whenever a new quirk is discovered.

---

## Authentication

### Cookie-based session auth

OrangeHRM supports OAuth2 Authorization Code flow only — no password grant or client_credentials.
API authentication uses the `_orangehrm` session cookie obtained from a UI login.
Playwright's `storageState()` captures the cookie and injects it into `APIRequestContext`.

---

## API Quirks

### HTTP status codes

OrangeHRM returns `200` for all successful operations:

- POST → 200 (not 201)
- PUT → 200
- DELETE → 200 (not 204)

### DELETE endpoint body

The PIM employee delete endpoint accepts a request body instead of a path parameter:

```
DELETE /api/v2/pim/employees
Body: { "ids": [empNumber1, empNumber2] }
```

### Optional string fields must be sent as empty string, not omitted

OrangeHRM API validation returns `422` when optional string fields are completely absent from the request body.
Always include optional string fields as empty strings rather than omitting them.

```json
{ "unitId": "", "description": "" }
```

**Affected endpoints:** `POST /admin/subunits` (fields: `unitId`, `description`)

**Example:**

❌ `{"name": "Unit", "parentId": 1}`
✅ `{"name": "Unit", "parentId": 1, "unitId": "", "description": ""}`

### nationality field in personal-details

The GET response returns `nationality` as an object: `{ id, name }`.
The PUT request expects `nationalityId` as an integer.
The same data uses a different field name and format depending on the operation direction.

### lastName max length

The `lastName` field accepts a maximum of 30 characters.
Dynamically generated values from factories may exceed this limit — use a fixed short string instead.

---

## Field Name Mapping

### API camelCase ↔ DB snake_case

| API Field     | DB Column          |
| ------------- | ------------------ |
| firstName     | emp_firstname      |
| lastName      | emp_lastname       |
| middleName    | emp_middle_name    |
| employeeId    | employee_id        |
| birthday      | emp_birthday       |
| gender        | emp_gender         |
| maritalStatus | emp_marital_status |
| nationalityId | nation_code        |


## Leave Module Prerequisites

Fresh OrangeHRM Docker seed has NO leave configuration — the following
must be provisioned before any leave request can succeed, or the API
returns opaque errors (500, or a 400 with a misleading-until-you-know-it message):

1. **Leave Period must be explicitly saved**, even with default Jan 1 –
   Dec 31 values. `GET /leave-period` returns `meta.leavePeriodDefined: false`
   until a `PUT` is made — the default `data` block shown is a template,
   not a saved period. Without this, leave request creation returns a
   generic `500 Unexpected Error Occurred`.

2. **At least one Leave Type must exist.** Fresh seed returns `data: []`
   from `GET /leave-types`. Create one via `POST /leave-types` before
   referencing any `leaveTypeId`.

3. **Workweek values are hours, not booleans.** `PUT /workweek` rejects
   `1`/`0` style booleans for weekdays (422) — use actual hour values
   (e.g. `8` for a full working day, `0` for non-working). **This seed's
   default workweek has Sat/Sun = 8 (working) and Mon–Fri = 0
   (non-working)** — inverted from a real-world expectation. Leave
   requests spanning only "0-hour" days fail with
   `400: Failed to Submit: No Working Days Selected`.

4. **At least one Leave Entitlement per (employee, leaveType) is likely
   required** for a request to actually be approvable/deducted — not yet
   confirmed, pending the next test (see Sprint 1 log).

These are now auto-provisioned by `scripts/seed-leave-prerequisites.ts`,
chained into `npm run docker:up` — no manual curl needed for future runs.

### Single-day leave requests always fail

Both `POST /leave/leave-requests` (self-service apply) and
`POST /leave/employees/leave-requests` (admin assign) reject ANY
single-day request (`fromDate === toDate`) with `400: Failed to Submit:
No Working Days Selected` — confirmed on multiple different weekdays
(Monday, Wednesday), with a correctly configured Mon–Fri workweek.

This is not a date/timezone issue — `DateTimeHelperService::dateRange()`
uses a do-while loop that correctly includes the single day. The bug is
further downstream, likely in how `isWeekend()`/`isHoliday()` classify
that single day. Root cause not fully traced past this point — not worth
further investigation, since the workaround is simple and total.

**Workaround — required for ALL leave test data, both flows:**
always use a minimum 2-day range (e.g. `fromDate: "2026-08-10",
toDate: "2026-08-11"`), even for scenarios that conceptually represent
"one day off."


### Postman's AI-generated docs can be wrong too

The Postman AI documentation for `DELETE /leave/leave-types` claimed both
`ids` (array) AND `leaveTypeId` (string) are required. Verified via direct
API call: only `ids` is required. `leaveTypeId` is not needed and was
likely hallucinated by whatever generated that doc — same failure mode
this project has already seen from Gemini, just from a different tool.
Lesson holds regardless of which AI produced the doc: verify before trusting.

**Correct body:** `{ "ids": [9] }` → `200` with `{ "data": [9], ... }`.