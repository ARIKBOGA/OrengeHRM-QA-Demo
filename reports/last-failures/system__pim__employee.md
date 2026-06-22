# Failures — system/pim/employee.spec.ts

> Generated: 2026-06-22T16:32:01.445Z

## PIM-C-002: Create Employee - All Fields (UI)

- **Line:** 91
- **Status:** failed

### Error

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
=========================== logs ===========================
waiting for response /\/web\/index\.php\/api\/v2\/pim\/employees/
============================================================

[90m   at [39m../src/pages/base.page.ts:56

[0m [90m 54 |[39m   ) {
 [90m 55 |[39m     [36mconst[39m [response] [33m=[39m [36mawait[39m [33mPromise[39m[33m.[39mall([
[31m[1m>[22m[39m[90m 56 |[39m       [36mthis[39m[33m.[39mpage[33m.[39mwaitForResponse(urlPattern)[33m,[39m
 [90m    |[39m                 [31m[1m^[22m[39m
 [90m 57 |[39m       action()[33m,[39m
 [90m 58 |[39m     ])[33m;[39m
 [90m 59 |[39m     [36mreturn[39m response[33m;[39m[0m
[2m    at AddEmployeePage.interceptResponse (/Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/src/pages/base.page.ts:56:17)[22m
[2m    at AddEmployeePage.save (/Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/src/pages/employee/add-employee.page.ts:37:16)[22m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:128:31[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-001: Search Employee - By Full Name (Exact Match)

- **Line:** 216
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31m2[39m

[0m [90m 252 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employeeData[33m.[39mfirstName)[33m;[39m
 [90m 253 |[39m         [90m// #6: getRecordCount() returns Promise[39m
[31m[1m>[22m[39m[90m 254 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m1[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 255 |[39m       } [36mfinally[39m {
 [90m 256 |[39m         [90m// #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber)[39m
 [90m 257 |[39m         [36mif[39m (empNumber) {[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:254:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-002: Search Employee - By Partial Name

- **Line:** 265
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m2[39m
Received: [31m3[39m

[0m [90m 304 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employee2[33m.[39mfirstName)[33m;[39m
 [90m 305 |[39m         [90m// #6: getRecordCount() returns Promise[39m
[31m[1m>[22m[39m[90m 306 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m2[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 307 |[39m       } [36mfinally[39m {
 [90m 308 |[39m         [90m// #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber)[39m
 [90m 309 |[39m         [90m// Teardown: Delete created employees[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:306:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-003: Search Employee - By Employee ID

- **Line:** 322
- **Status:** failed

### Error

```
Error: locator.fill: value: expected string, got object

[0m [90m 355 |[39m         [90m// Fill Employee ID search field — second input in the search form[39m
 [90m 356 |[39m         [36mconst[39m employeeIdSearchInput [33m=[39m authenticatedPage[33m.[39mlocator([32m'.oxd-input'[39m)[33m.[39mnth([35m1[39m)[33m;[39m
[31m[1m>[22m[39m[90m 357 |[39m         [36mawait[39m employeeIdSearchInput[33m.[39mfill(autoEmployeeId[33m![39m)[33m;[39m
 [90m     |[39m                                     [31m[1m^[22m[39m
 [90m 358 |[39m         [36mawait[39m employeeListPage[33m.[39msearchButton[33m.[39mclick()[33m;[39m
 [90m 359 |[39m         [36mawait[39m employeeListPage[33m.[39mwaitForPageReady()[33m;[39m
 [90m 360 |[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:357:37[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-004: Search Employee - No Results Found

- **Line:** 376
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m1[39m

[0m [90m 399 |[39m       [90m// await expect(employeeListPage.getByText('No Records Found')).toBeVisible();[39m
 [90m 400 |[39m       [90m// #6: getRecordCount() returns Promise[39m
[31m[1m>[22m[39m[90m 401 |[39m       expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m0[39m)[33m;[39m
 [90m     |[39m                                                       [31m[1m^[22m[39m
 [90m 402 |[39m     }
 [90m 403 |[39m   )[33m;[39m
 [90m 404 |[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:401:55[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-005: Search Employee - View Employee Details

- **Line:** 405
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: 'Detail' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: 'Detail' }) resolved to 2 elements:
    1) <h6 data-v-7b563373="" data-v-af86f9aa="" class="oxd-text oxd-text--h6 --strong">Detail View</h6> aka getByRole('heading', { name: 'Detail View' })
    2) <h6 data-v-7b563373="" data-v-6653c066="" class="oxd-text oxd-text--h6 orangehrm-main-title">Personal Details</h6> aka getByRole('heading', { name: 'Personal Details' })

Call log:
[2m  - Expect "toBeVisible" with timeout 10000ms[22m
[2m  - waiting for getByRole('heading', { name: 'Detail' })[22m


[0m [90m 441 |[39m
 [90m 442 |[39m         [90m// 3. Verify that the employee's detailed profile page is displayed.[39m
[31m[1m>[22m[39m[90m 443 |[39m         [36mawait[39m expect(authenticatedPage[33m.[39mgetByRole([32m'heading'[39m[33m,[39m { name[33m:[39m employeeData[33m.[39mfirstName[33m,[39m exact[33m:[39m [36mfalse[39m }))[33m.[39mtoBeVisible()[33m;[39m [90m// Assuming name is part of heading[39m
 [90m     |[39m                                                                                                              [31m[1m^[22m[39m
 [90m 444 |[39m         [36mawait[39m expect(authenticatedPage[33m.[39mlocator([32m'.orangehrm-horizontal-padding h6'[39m)[33m.[39mfilter({ hasText[33m:[39m [32m'Personal Details'[39m }))[33m.[39mtoBeVisible()[33m;[39m
 [90m 445 |[39m
 [90m 446 |[39m         [90m// 4. Verify some key information on the profile page.[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:443:110[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-D-001: Delete Single Employee (UI)

- **Line:** 500
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('No Records Found')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 10000ms[22m
[2m  - waiting for getByText('No Records Found')[22m


[0m [90m 550 |[39m         [90m// 7. Verify the employee is no longer present in the results table.[39m
 [90m 551 |[39m         [36mawait[39m employeeListPage[33m.[39msearchByName(employeeData[33m.[39mfirstName)[33m;[39m [90m// Re-search to confirm absence[39m
[31m[1m>[22m[39m[90m 552 |[39m         [36mawait[39m expect(employeeListPage[33m.[39mgetByText([32m'No Records Found'[39m))[33m.[39mtoBeVisible()[33m;[39m
 [90m     |[39m                                                                      [31m[1m^[22m[39m
 [90m 553 |[39m         [90m// #6: getRecordCount() returns Promise[39m
 [90m 554 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m0[39m)[33m;[39m
 [90m 555 |[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:552:70[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-D-002: Delete Multiple Employees (UI)

- **Line:** 574
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText('No Records Found')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 10000ms[22m
[2m  - waiting for getByText('No Records Found')[22m


[0m [90m 625 |[39m         [90m// 7. Verify the selected employees are no longer present in the results table.[39m
 [90m 626 |[39m         [36mawait[39m employeeListPage[33m.[39msearchByName([32m'MultiDelete'[39m)[33m;[39m [90m// Re-search[39m
[31m[1m>[22m[39m[90m 627 |[39m         [36mawait[39m expect(employeeListPage[33m.[39mgetByText([32m'No Records Found'[39m))[33m.[39mtoBeVisible()[33m;[39m
 [90m     |[39m                                                                      [31m[1m^[22m[39m
 [90m 628 |[39m         [90m// #6: getRecordCount() returns Promise[39m
 [90m 629 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m0[39m)[33m;[39m
 [90m 630 |[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:627:70[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

