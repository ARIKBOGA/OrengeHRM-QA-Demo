# Failures — system/pim/employee.spec.ts

> Generated: 2026-07-07T18:17:09.717Z

## PIM-R-001: Search Employee - By Full Name (Exact Match)

- **Line:** 221
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m1[39m
Received: [31m2[39m

[0m [90m 263 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employeeData[33m.[39mfirstName)[33m;[39m
 [90m 264 |[39m         [90m// #6: getRecordCount() returns Promise[39m
[31m[1m>[22m[39m[90m 265 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m1[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 266 |[39m       } [36mfinally[39m {
 [90m 267 |[39m         [90m// #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber)[39m
 [90m 268 |[39m         [36mif[39m (empNumber) {[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:265:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-002: Search Employee - By Partial Name

- **Line:** 276
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m2[39m
Received: [31m3[39m

[0m [90m 316 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employee2[33m.[39mfirstName)[33m;[39m
 [90m 317 |[39m         [90m// #6: getRecordCount() returns Promise[39m
[31m[1m>[22m[39m[90m 318 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m2[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 319 |[39m       } [36mfinally[39m {
 [90m 320 |[39m         [90m// #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber)[39m
 [90m 321 |[39m         [90m// Teardown: Delete created employees[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:318:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-R-004: Search Employee - No Results Found

- **Line:** 401
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m1[39m

[0m [90m 424 |[39m       [90m// 3. Verify that a "No Records Found" message is displayed in the results area.[39m
 [90m 425 |[39m       [90m// #6: getRecordCount() returns Promise, and already checks for 'Records (0) Found'[39m
[31m[1m>[22m[39m[90m 426 |[39m       expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m0[39m)[33m;[39m
 [90m     |[39m                                                       [31m[1m^[22m[39m
 [90m 427 |[39m       [90m// Removed direct 'No Records Found' locator as getRecordCount is more robust.[39m
 [90m 428 |[39m       [90m// await expect(employeeListPage.getByText('No Records Found')).toBeVisible();[39m
 [90m 429 |[39m     }[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:426:55[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-D-001: Delete Single Employee (UI)

- **Line:** 530
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m0[39m
Received: [31m1[39m

[0m [90m 586 |[39m         [90m// #12: Re-search by full name. If expecting 0 records, getRecordCount is more robust.[39m
 [90m 587 |[39m         [36mawait[39m employeeListPage[33m.[39msearchByName([32m`${employeeData.firstName} ${employeeData.lastName}`[39m)[33m;[39m [90m// Re-search to confirm absence[39m
[31m[1m>[22m[39m[90m 588 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m0[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 589 |[39m         [36mawait[39m expect(employeeListPage[33m.[39mgetByText([32m'No Records Found'[39m))[33m.[39mtoBeVisible()[33m;[39m
 [90m 590 |[39m
 [90m 591 |[39m         [90m// 8. Use Playwright request to verify the employee is not found via API.[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:588:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

## PIM-D-002: Delete Multiple Employees (UI)

- **Line:** 609
- **Status:** failed

### Error

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m2[39m
Received: [31m3[39m

[0m [90m 649 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employee1[33m.[39mfirstName)[33m;[39m
 [90m 650 |[39m         [36mawait[39m employeeListPage[33m.[39mexpectEmployeeVisible(employee2[33m.[39mfirstName)[33m;[39m
[31m[1m>[22m[39m[90m 651 |[39m         expect([36mawait[39m employeeListPage[33m.[39mgetRecordCount())[33m.[39mtoBe([35m2[39m)[33m;[39m
 [90m     |[39m                                                         [31m[1m^[22m[39m
 [90m 652 |[39m
 [90m 653 |[39m         [90m// 3. Select the checkboxes next to two or more employees[39m
 [90m 654 |[39m         [36mawait[39m authenticatedPage[33m.[39mlocator([32m'.oxd-table-row'[39m[33m,[39m { hasText[33m:[39m employee1[33m.[39mfirstName })[33m.[39mlocator([32m'.oxd-checkbox-input'[39m)[33m.[39mclick()[33m;[39m[0m
[2m    at /Users/burakarikboga/Desktop/Projects/AI/QA_Base_Framework/orangehrm-qa/tests/system/pim/employee.spec.ts:651:57[22m
```

### Stdout

```
[DB] Connected to MySQL at localhost:3306/orangehrm
[DB] Disconnected from MySQL

```

---

