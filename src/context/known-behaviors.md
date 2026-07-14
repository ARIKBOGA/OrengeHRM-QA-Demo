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

---

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

3. **Workweek values are INVERTED from intuitive expectation — this took
   two rounds to get right, document carefully.**

   `PUT /workweek` accepts an integer per day, but the meaning is the
   opposite of what "hours worked" suggests:
   **`0` = working day, `8` = `WorkWeek::WORKWEEK_LENGTH_NON_WORKING_DAY`
   (non-working day).**

   Root cause, traced through source:
   `LeaveApplicationService::saveLeaveRequest()` →
   `AbstractLeaveAllocationService::isWeekend()` →
   `BasicWorkSchedule::isNonWorkingDay()` →
   `WorkWeekDao::isNonWorkingDay()`, which does:
   ```php
   $getter = 'get' . $date->format('l'); // e.g. getMonday()
   return ($workWeek->$getter() == WorkWeek::WORKWEEK_LENGTH_NON_WORKING_DAY); // == 8
   ```
   So any day whose stored value equals `8` is treated as non-working.

   Fresh Docker seed ships with Sat/Sun = 8, Mon–Fri = 0 — this is
   CORRECT out of the box (weekend non-working, weekdays working). We
   initially misread this as inverted and "corrected" it to
   `{monday: 8, ..., saturday: 0}`, which actually flipped the workweek
   backwards — Mon–Fri became non-working, causing every weekday leave
   request to fail with `400: Failed to Submit: No Working Days Selected`
   regardless of which weekday was chosen. Confirmed via direct DB
   inspection (`ohrm_work_week` table, single row, columns `mon`..`sun`)
   and source trace, not by guessing.

   **Correct provisioning (now in `scripts/seed-leave-prerequisites.ts`,
   chained into `npm run docker:up` — no manual curl needed):**
   ```json
   { "monday": 0, "tuesday": 0, "wednesday": 0, "thursday": 0, "friday": 0, "saturday": 8, "sunday": 8 }
   ```

4. **At least one Leave Entitlement per (employee, leaveType) is likely
   required** for a request to actually be approvable/deducted — not yet
   confirmed, pending the next test (see Sprint 1 log).

### RETRACTED — "single-day leave requests always fail"

An earlier version of this document claimed single-day leave requests
(`fromDate === toDate`) always fail with `400: Failed to Submit: No
Working Days Selected`, and recommended a 2-day-minimum workaround for
all leave test data.

**This was false.** The tests behind that finding were run while the
workweek was in the inverted/broken state described above (Mon–Fri
incorrectly set to `8` = non-working). Once the workweek was corrected
(Mon–Fri = `0` = working), a single-day request succeeded immediately:

```bash
curl -X POST ".../api/v2/leave/employees/leave-requests" \
  -d '{"empNumber":1,"leaveTypeId":1,"fromDate":"2026-08-12","toDate":"2026-08-12","duration":{"type":"full_day"}}'
# → 200, leave request id created successfully
```

**Lesson:** re-verify a "confirmed" bug after fixing an unrelated,
earlier-in-the-chain misconfiguration — a downstream symptom can
disappear once the real upstream cause is fixed. No 2-day-minimum
workaround is needed; single-day and multi-day ranges both work
correctly once the workweek is provisioned as intended.

### Postman's AI-generated docs can be wrong too

The Postman AI documentation for `DELETE /leave/leave-types` claimed both
`ids` (array) AND `leaveTypeId` (string) are required. Verified via direct
API call: only `ids` is required. `leaveTypeId` is not needed and was
likely hallucinated by whatever generated that doc — same failure mode
this project has already seen from Gemini, just from a different tool.
Lesson holds regardless of which AI produced the doc: verify before trusting.

**Correct body:** `{ "ids": [9] }` → `200` with `{ "data": [9], ... }`.