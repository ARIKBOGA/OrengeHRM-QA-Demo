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

| API Field      | DB Column           |
| -------------- | ------------------- |
| firstName      | emp_firstname       |
| lastName       | emp_lastname        |
| middleName     | emp_middle_name     |
| employeeId     | employee_id         |
| birthday       | emp_birthday        |
| gender         | emp_gender          |
| maritalStatus  | emp_marital_status  |
| nationalityId  | nation_code         |