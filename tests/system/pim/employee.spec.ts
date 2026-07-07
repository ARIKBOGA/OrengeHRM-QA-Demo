import { test, expect } from '@fixtures/base.fixture';
import { createEmployee } from '@data/factories/employee.factory';
import { InterceptorUtil } from '@utils/api/interceptor.util';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { SeedUtil } from '@utils/db/seed.util';
import { Employee, ApiResponse } from '@t/api.types';
import { config } from '@config/env';
import { AddEmployeePage } from '@pages/employee/add-employee.page';
import { EmployeeListPage } from '@pages/employee/employee-list.page';

let requestUtil: RequestUtil;
let dbAssertion: DbAssertionUtil;
let seedUtil: SeedUtil;

// Helper to generate a short unique string for names to avoid clashes.
// FIX #12: Made suffix longer for better uniqueness to avoid partial matches with dirty data.
const getUniqueSuffix = () => Math.random().toString(36).substring(2, 12); // Now 10 characters long

test.describe('PIM Employee System Tests', { annotation: [{ type: 'Feature', description: 'PIM Module - Employee Management (UI & API/DB)' }] }, () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    dbAssertion = new DbAssertionUtil(db);
    seedUtil = new SeedUtil(db);
  });

  test(
    'PIM-C-001: Create Employee - Required Fields (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-C-001' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      // FIX #9: Use short fixed strings for names
      const employeeData = createEmployee({ firstName: 'John', lastName: 'Doe' });
      let empNumber: number | undefined;
      const interceptor = new InterceptorUtil(authenticatedPage);

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const addEmployeePage = new AddEmployeePage(authenticatedPage);

        // FIX #7, #8: Intercept the API call BEFORE UI actions with full path (already correct)
        interceptor.startCapturing(/\/web\/index.php\/api\/v2\/pim\/employees/);

        // 1. Navigate to PIM > Add Employee
        await addEmployeePage.navigate();

        // 2. Fill in First Name, Last Name
        await addEmployeePage.fillEmployeeForm({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
        });

        // 3. Click "Save"
        // FIX #11: AddEmployeePage.save() has its own internal waitForResponse. Bypass it when using external InterceptorUtil.
        await authenticatedPage.getByRole('button', { name: 'Save' }).click();

        // 4. Verify a success toast message ("Successfully Saved") appears
        await addEmployeePage.expectSaveSuccess();

        // Get empNumber from intercepted response
        const apiResponse = await interceptor.getLastResponseBody<ApiResponse<Employee>>();
        empNumber = apiResponse?.data?.empNumber;
        expect(empNumber).toBeDefined();

        // 5. Verify the employee's profile page is displayed (implicitly by save success, no direct POM verification for specific page)

        // 6. Use Playwright request to get the employee details via API by ID.
        // RequestUtil correctly transforms the path internally per #8.
        const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
        expect(getEmployeeResponse.data.some((emp) => emp.empNumber === empNumber && emp.firstName === employeeData.firstName)).toBe(true);

        // 7. Perform a direct database query to verify the record exists with correct details.
        await dbAssertion.expectRowExists('hs_hr_employee', {
          emp_number: empNumber,
          emp_firstname: employeeData.firstName,
          emp_lastname: employeeData.lastName,
        });
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        if (empNumber) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  test(
    'PIM-C-002: Create Employee - All Fields (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-C-002' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      // FIX #9: Use short fixed strings for names
      const employeeData = createEmployee({
        firstName: 'Jane',
        middleName: 'M.',
        lastName: 'Smith',
      });
      let empNumber: number | undefined;
      const interceptor = new InterceptorUtil(authenticatedPage);

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const addEmployeePage = new AddEmployeePage(authenticatedPage);

        // FIX #7, #8: Intercept the API call BEFORE UI actions with full path (already correct)
        interceptor.startCapturing(/\/web\/index.php\/api\/v2\/pim\/employees/);

        // 1. Navigate to PIM > Add Employee
        await addEmployeePage.navigate();

        // 2. Fill in First Name, Middle Name, Last Name
        await addEmployeePage.fillEmployeeForm({
          firstName: employeeData.firstName,
          middleName: employeeData.middleName,
          lastName: employeeData.lastName,
        });

        // 3. Click "Save"
        // FIX #11: AddEmployeePage.save() has its own internal waitForResponse. Bypass it when using external InterceptorUtil.
        await authenticatedPage.getByRole('button', { name: 'Save' }).click();

        // 4. Verify a success toast message appears
        await addEmployeePage.expectSaveSuccess();

        const apiResponse = await interceptor.getLastResponseBody<ApiResponse<Employee>>();
        empNumber = apiResponse?.data?.empNumber;
        expect(empNumber).toBeDefined();

        // 5. Verify the employee's profile page is displayed with all entered details.
        // No specific POM method to verify all details on profile page. Assert via API/DB.

        // 6. Use Playwright request to get the employee details via API by ID.
        // RequestUtil correctly transforms the path internally per #8.
        const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
        const createdEmployee = getEmployeeResponse.data.find((emp) => emp.empNumber === empNumber);
        expect(createdEmployee?.firstName).toBe(employeeData.firstName);
        expect(createdEmployee?.middleName).toBe(employeeData.middleName);
        expect(createdEmployee?.lastName).toBe(employeeData.lastName);
        // Removing assertion for employeeId as it's auto-generated and not set via UI in this test.
        // expect(createdEmployee?.employeeId).toBe(employeeData.employeeId);

        // 7. Perform a direct database query to verify all optional fields are correctly persisted.
        await dbAssertion.expectRowExists('hs_hr_employee', {
          emp_number: empNumber,
          emp_firstname: employeeData.firstName,
          // FIX #2: Wrong DB column name (already correct in the provided code snippet)
          emp_middle_name: employeeData.middleName,
          emp_lastname: employeeData.lastName,
          employee_id: createdEmployee?.employeeId, // Use the auto-generated ID from the API response
        });
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        if (empNumber) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  test(
    'PIM-C-003: Create Employee - Mandatory Field Constraint Violation (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-C-003' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      // FIX #9: Use short fixed strings for names
      const invalidEmployeeData = createEmployee({ firstName: '', lastName: 'MissingFirst' });

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(invalidEmployeeData) });

      // FIX #1: Instantiate page object with authenticatedPage (already correct)
      const addEmployeePage = new AddEmployeePage(authenticatedPage);

      // 1. Navigate to PIM > Add Employee
      await addEmployeePage.navigate();

      // 2. Leave First Name field empty
      await addEmployeePage.fillEmployeeForm({
        firstName: invalidEmployeeData.firstName, // Empty string
        lastName: invalidEmployeeData.lastName,
      });

      // 3. Attempt to click "Save"
      await authenticatedPage.getByRole('button', { name: 'Save' }).click();

      // 4. Verify an inline error message ("Required") appears next to the missing mandatory field.
      await expect(
        authenticatedPage
          .locator('.oxd-input-group')
          .filter({ has: authenticatedPage.locator('[name="firstName"]') })
          .locator('.oxd-text--span')
      ).toHaveText('Required');

      // 5. Verify the form is not submitted and no success message appears.
      await expect(authenticatedPage.locator('.oxd-toast--success')).not.toBeVisible();

      // 6. Perform a direct database query to confirm no new employee record was created.
      if (config.dbEnabled) {
        await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_lastname: invalidEmployeeData.lastName });
      }
      // No teardown needed as employee not created
    }
  );

  test(
    'PIM-R-001: Search Employee - By Full Name (Exact Match)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-R-001' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed strings, combining with unique suffix for search isolation
      const employeeData = createEmployee({
        firstName: `SR-${uniqueSuffix}`, // SR for Search, reducing total string length
        middleName: 'By',
        lastName: `NM-${uniqueSuffix}`, // NM for Name, reducing total string length
      });
      let empNumber: number | undefined;

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // Pre-condition: Create an employee via API
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          middleName: employeeData.middleName, // API field adı camelCase
        });
        empNumber = createResponse.data.empNumber;
        expect(empNumber).toBeDefined();

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 1. Navigate to PIM > Employee List
        await employeeListPage.navigate();

        // 2. Enter the exact full name into the Employee Name search field.
        // FIX #12: Employee Name search is partial/substring match, not exact. Search by full name. (already correct)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`);

        // 3. Verify that only the matching employee's record is displayed in the results table.
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);
        // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
        await employeeListPage.expectRecordCount(1);
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        if (empNumber) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  test(
    'PIM-R-002: Search Employee - By Partial Name',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-R-002' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed names, combining with unique suffix for search isolation
      const commonPartialName = `PTL-${uniqueSuffix}`; // PTL for Partial Test
      const employee1 = createEmployee({ firstName: `${commonPartialName}-1`, lastName: 'Alpha' });
      const employee2 = createEmployee({ firstName: `${commonPartialName}-2`, lastName: 'Beta' });
      let empNumber1: number | undefined;
      let empNumber2: number | undefined;

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify([employee1, employee2]) });

      try {
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse1 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee1);
        empNumber1 = createResponse1.data.empNumber;
        const createResponse2 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee2);
        empNumber2 = createResponse2.data.empNumber;
        expect(empNumber1).toBeDefined();
        expect(empNumber2).toBeDefined();

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 1. Navigate to PIM > Employee List
        await employeeListPage.navigate();

        // 2. Enter a partial string into the Employee Name search field.
        await employeeListPage.searchByName(commonPartialName);

        // 3. Verify that all employees whose names contain the partial string are displayed.
        await employeeListPage.expectEmployeeVisible(employee1.firstName);
        await employeeListPage.expectEmployeeVisible(employee2.firstName);
        // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
        await employeeListPage.expectRecordCount(2);
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        // Teardown: Delete created employees
        if (empNumber1) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber1}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber1);
        }
        if (empNumber2) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber2}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber2);
        }
      }
    }
  );

  test(
    'PIM-R-003: Search Employee - By Employee ID',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-R-003' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      let empNumber: number | undefined;
      const uniqueEmployeeId = `ID-${Math.random().toString(36).substring(2, 8)}`; // More unique ID

      test.info().annotations.push({ type: 'Test Data', description: 'Employee ID search test' });

      try {
        // Setup: create employee via API, explicitly providing an employeeId
        const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
          firstName: 'IDSearch', // FIX #9: Short fixed string
          lastName: 'User', // FIX #9: Short fixed string
          employeeId: uniqueEmployeeId, // Provide a unique employeeId
        });
        empNumber = createResponse.data.empNumber;
        expect(empNumber).toBeDefined();

        // Get auto-generated employeeId from API
        // Corrected API call and access: /api/v2/pim/employees with query param returns an array.
        const detailResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
        const retrievedEmployee = detailResponse.data.find((emp) => emp.empNumber === empNumber);
        const autoEmployeeId = retrievedEmployee?.employeeId;
        expect(autoEmployeeId).toBeDefined();
        expect(typeof autoEmployeeId).toBe('string'); // Now it should be a string
        expect(autoEmployeeId).toBe(uniqueEmployeeId); // And match what we set

        test.info().annotations.push({
          type: 'Employee ID',
          description: `empNumber: ${empNumber}, employeeId: ${autoEmployeeId}`,
        });

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // Navigate to Employee List
        await employeeListPage.navigate();

        // Fill Employee ID search field — second input in the search form
        const employeeIdSearchInput = authenticatedPage.locator('.oxd-input').nth(1);
        await employeeIdSearchInput.fill(String(autoEmployeeId!)); // Ensure string conversion for robustness

        // FIX #4: employeeListPage.searchButton is public, but this direct click is fine for ID search as no specific POM method exists. (already correct)
        await authenticatedPage.getByRole('button', { name: 'Search' }).click();
        await employeeListPage.waitForPageReady();

        // Assert
        await employeeListPage.expectEmployeeVisible('IDSearch');
        await employeeListPage.expectRecordCount(1);
      } finally {
        if (empNumber) {
          test.info().annotations.push({
            type: 'Teardown Action',
            description: `Deleting empNumber: ${empNumber}`,
          });
          // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  test(
    'PIM-R-004: Search Employee - No Results Found',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-R-004' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      // FIX #12: Use a highly unique, non-matching string to avoid partial matches with existing data.
      // FIX #9: Keep name part short, rely on longer suffix for uniqueness.
      const nonExistentName = `NFR-${getUniqueSuffix()}`; // NFR for No Found Results

      test.info().annotations.push({ type: 'Test Data', description: `Non-existent Name: ${nonExistentName}` });

      // FIX #1: Instantiate page object with authenticatedPage (already correct)
      const employeeListPage = new EmployeeListPage(authenticatedPage);

      // 1. Navigate to PIM > Employee List
      await employeeListPage.navigate();

      // 2. Enter a non-existent name into the Employee Name search field.
      await employeeListPage.searchByName(nonExistentName);

      // 3. Verify that a "No Records Found" message is displayed in the results area.
      // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
      await employeeListPage.expectRecordCount(0);
      await employeeListPage.expectNoRecordsFound();
    }
  );

  test(
    'PIM-R-005: Search Employee - View Employee Details',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-R-005' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed strings, combining with unique suffix for search isolation
      const employeeData = createEmployee({ firstName: `Dtl-${uniqueSuffix}`, lastName: `Vw-${uniqueSuffix}` });
      let empNumber: number | undefined;

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // Pre-condition: Create an employee via API
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          middleName: employeeData.middleName, // API field adı camelCase
        });
        empNumber = createResponse.data.empNumber;
        expect(empNumber).toBeDefined();

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 1. Search for an existing employee
        await employeeListPage.navigate();
        // FIX #12: Search by full name for better isolation when expecting specific single results. (already correct)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`);

        // 2. Click on the employee's name in the results table.
        await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).locator('button').first().click();
        await authenticatedPage.waitForLoadState('networkidle');

        // 3. Verify that the employee's detailed profile page is displayed.
        // FIX for strict mode violation: Be more specific with the heading locator to match the full name.
        await expect(authenticatedPage.getByRole('heading', { name: `${employeeData.firstName} ${employeeData.lastName}`, exact: true })).toBeVisible();
        await expect(authenticatedPage.locator('.orangehrm-horizontal-padding h6').filter({ hasText: 'Personal Details' })).toBeVisible();

        // 4. Verify some key information on the profile page.
        // We don't have specific POMs for the details page, so direct locator checks.
        await expect(authenticatedPage.locator('[name="firstName"]')).toHaveValue(employeeData.firstName);
        await expect(authenticatedPage.locator('[name="lastName"]')).toHaveValue(employeeData.lastName);
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        // Teardown: Delete the created employee
        if (empNumber) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  // PIM-U-XXX Test Cases (Update Employee) - Cannot be fully implemented with current POMs
  // The provided POMs (LoginPage, DashboardPage, AddEmployeePage, EmployeeListPage, etc.)
  // do not include functionality to navigate to an employee's detailed profile page and
  // interact with 'Edit' buttons or fields like 'Nationality', 'Marital Status', 'Date of Birth'.
  // The `AddEmployeePage` is solely for adding. Thus, these UI update scenarios
  // described in the test plan (PIM-U-001, PIM-U-002) are out of scope for strict adherence
  // to "USE ONLY methods, properties, and classes that exist in the source files".
  test.skip(
    'PIM-U-001: Update Employee - Personal Details (UI) - SKIPPED due to POM limitations',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-U-001' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async () => {
      test.info().annotations.push({
        type: 'Note',
        description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for employee profile page editing.',
      });
    }
  );

  test.skip(
    'PIM-U-002: Update Employee - Mandatory Field Violation (UI) - SKIPPED due to POM limitations',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-U-002' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async () => {
      test.info().annotations.push({
        type: 'Note',
        description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for employee profile page editing.',
      });
    }
  );

  test(
    'PIM-D-001: Delete Single Employee (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-D-001' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed strings, combining with unique suffix for search isolation
      const employeeData = createEmployee({ firstName: `DelS-${uniqueSuffix}`, lastName: `Sngl-${uniqueSuffix}` });
      let empNumber: number | undefined;

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // 1. Create a test employee via API
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          middleName: employeeData.middleName, // API field adı camelCase
        });
        empNumber = createResponse.data.empNumber;
        expect(empNumber).toBeDefined();

        // Verify employee exists in DB before UI interaction
        await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 2. Search for the employee
        await employeeListPage.navigate();
        // FIX #12: Search by full name for better isolation when expecting specific single results. (already correct)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`);
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);

        // 3. Select the checkbox next to the employee's name
        await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).locator('.oxd-checkbox-input').click();

        // 4. Click the "Delete Selected" button
        await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

        // FIX #5: OrangeHRM does NOT use native browser dialogs
        // FIX for PIM-D-001 failure: Add waitForResponse for the delete API call
        const deleteResponsePromise = authenticatedPage.waitForResponse(
          (resp) => resp.url().includes('/web/index.php/api/v2/pim/employees') && resp.request().method() === 'DELETE',
          { timeout: 10000 }
        );
        // 5. Confirm the deletion in the confirmation dialog
        await authenticatedPage.getByRole('button', { name: 'Yes, Delete' }).click();
        await deleteResponsePromise; // Wait for the network response after clicking delete button.

        // 6. Verify a success toast message appears
        await expect(authenticatedPage.locator('.oxd-toast--success')).toBeVisible();

        // 7. Verify the employee is no longer present in the results table.
        // FIX #12: Re-search by full name. If expecting 0 records, getRecordCount is more robust. (already correct, error was due to dirty data)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`); // Re-search to confirm absence
        // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
        await employeeListPage.expectRecordCount(0);
        await employeeListPage.expectNoRecordsFound();

        // 8. Use Playwright request to verify the employee is not found via API.
        // FIX #17: OrangeHRM returns 422 (not 200+empty array) when filtering by
        // an empNumber that no longer exists — this itself confirms deletion.
        const getEmployeeRawResponse = await requestUtil.getRaw('/api/v2/pim/employees', { empNumber: empNumber! });
        if (getEmployeeRawResponse.status() === 200) {
          const body = (await getEmployeeRawResponse.json()) as ApiResponse<Employee[]>;
          expect(body.data.some((emp) => emp.empNumber === empNumber)).toBe(false);
        } else {
          expect(getEmployeeRawResponse.status()).toBe(422);
        }

        // 9. Perform a direct database query to confirm the record is deleted.
        await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumber });
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        // 10. Teardown: Ensure employee is deleted (if not, force delete via DB)
        if (empNumber && config.dbEnabled) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );

  test(
    'PIM-D-002: Delete Multiple Employees (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-D-002' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed strings, combining with unique suffix for search isolation.
      const commonSearchTerm = `MltDel-${uniqueSuffix}`; // MltDel for Multi Delete
      const employee1 = createEmployee({ firstName: `${commonSearchTerm}-1`, lastName: 'Alpha' });
      const employee2 = createEmployee({ firstName: `${commonSearchTerm}-2`, lastName: 'Beta' });
      let empNumbers: number[] = [];

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify([employee1, employee2]) });

      try {
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse1 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee1);
        empNumbers.push(createResponse1.data.empNumber);
        const createResponse2 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee2);
        empNumbers.push(createResponse2.data.empNumber);

        expect(empNumbers.every((num) => typeof num === 'number')).toBe(true);

        // Verify employees exist in DB before UI interaction
        await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumbers[0] });
        await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumbers[1] });

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 2. Navigate to PIM > Employee List and search for these employees using their common partial name
        await employeeListPage.navigate();
        await employeeListPage.searchByName(commonSearchTerm); // Search for common partial name

        // Verify both employees are visible and only these two
        await employeeListPage.expectEmployeeVisible(employee1.firstName);
        await employeeListPage.expectEmployeeVisible(employee2.firstName);
        // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
        await employeeListPage.expectRecordCount(2);

        // 3. Select the checkboxes next to two or more employees
        await authenticatedPage.locator('.oxd-table-row', { hasText: employee1.firstName }).locator('.oxd-checkbox-input').click();
        await authenticatedPage.locator('.oxd-table-row', { hasText: employee2.firstName }).locator('.oxd-checkbox-input').click();

        // 4. Click the "Delete Selected" button
        await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

        // FIX #5: OrangeHRM does NOT use native browser dialogs
        // FIX for PIM-D-002 failure: Add waitForResponse for the delete API call
        const deleteResponsePromise = authenticatedPage.waitForResponse(
          (resp) => resp.url().includes('/web/index.php/api/v2/pim/employees') && resp.request().method() === 'DELETE',
          { timeout: 10000 }
        );
        // 5. Confirm the deletion in the confirmation dialog
        await authenticatedPage.getByRole('button', { name: 'Yes, Delete' }).click();
        await deleteResponsePromise; // Wait for the network response after clicking delete button.

        // 6. Verify a success toast message appears
        await expect(authenticatedPage.locator('.oxd-toast--success')).toBeVisible();

        // 7. Verify the selected employees are no longer present in the results table.
        // FIX #12: Re-search by common partial name. (already correct, error was due to dirty data)
        await employeeListPage.searchByName(commonSearchTerm); // Re-search
        // FIX #6: getRecordCount() returns Promise (already correct, error was due to dirty data)
        await employeeListPage.expectRecordCount(0); // Should be zero
        await employeeListPage.expectNoRecordsFound();

        // 8. Use Playwright request to verify all deleted employees are not found via API.
        // Note: no empNumber filter here (fetches full list), so this does not hit
        // the 422-on-filtered-deleted-empNumber behavior — no change needed (FIX #17
        // only applies to filtered single-empNumber lookups, see PIM-D-001).
        const getEmployeesResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees');
        expect(getEmployeesResponse.data.some((emp) => empNumbers.includes(emp.empNumber))).toBe(false);

        // 9. Perform a direct database query to confirm all selected records are deleted.
        await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumbers[0] });
        await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumbers[1] });
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        // 10. Teardown: Ensure all employees are deleted
        if (empNumbers.length > 0 && config.dbEnabled) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumbers: ${empNumbers.join(', ')}` });
          for (const empNum of empNumbers) {
            await seedUtil.cleanupEmployeeByEmpNumber(empNum);
          }
        }
      }
    }
  );

  test(
    'PIM-D-003: Delete Employee - Cancel Deletion (UI)',
    {
      annotation: [
        { type: 'Test ID', description: 'PIM-D-003' },
        { type: 'Layer', description: 'System, E2E' },
      ],
    },
    async ({ authenticatedPage }) => {
      const uniqueSuffix = getUniqueSuffix();
      // FIX #9: Use short fixed strings, combining with unique suffix for search isolation
      const employeeData = createEmployee({ firstName: `Cncl-${uniqueSuffix}`, lastName: `Del-${uniqueSuffix}` });
      let empNumber: number | undefined;

      test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

      try {
        // 1. Create a test employee via API
        // RequestUtil correctly transforms the path internally per #8.
        const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          middleName: employeeData.middleName, // API field adı camelCase
        });
        empNumber = createResponse.data.empNumber;
        expect(empNumber).toBeDefined();

        // Verify employee exists in DB before UI interaction
        await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

        // FIX #1: Instantiate page object with authenticatedPage (already correct)
        const employeeListPage = new EmployeeListPage(authenticatedPage);

        // 2. Search for the employee
        await employeeListPage.navigate();
        // FIX #12: Search by full name for better isolation when expecting specific single results. (already correct)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`);
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);

        // 3. Select the checkbox next to the employee's name
        await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).locator('.oxd-checkbox-input').click();

        // 4. Click the "Delete Selected" button
        await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

        // FIX #5: OrangeHRM does NOT use native browser dialogs
        // 5. In the confirmation dialog, click "No, Cancel"
        // Assuming a "No, Cancel" button for dismissal
        await authenticatedPage.getByRole('button', { name: 'No, Cancel' }).click();
        // Wait for potential UI updates after closing the dialog
        await authenticatedPage.waitForLoadState('domcontentloaded');

        // 6. Verify the confirmation dialog closes and no success message appears.
        await expect(authenticatedPage.locator('.oxd-toast--success')).not.toBeVisible();

        // 7. Verify the employee is still present in the results table.
        // FIX #12: Re-search by full name. (already correct)
        await employeeListPage.searchByName(`${employeeData.firstName} ${employeeData.lastName}`); // Re-search to confirm presence
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);
        // FIX #6: getRecordCount() returns Promise (already correct)
        await employeeListPage.expectRecordCount(1);

        // 8. Use Playwright request to verify the employee is still found via API.
        // RequestUtil correctly transforms the path internally per #8.
        const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber });
        expect(getEmployeeResponse.data.some((emp) => emp.empNumber === empNumber && emp.firstName === employeeData.firstName)).toBe(true);

        // 9. Perform a direct database query to confirm the record still exists.
        await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });
      } finally {
        // FIX #3: Use seedUtil.cleanupEmployeeByEmpNumber(empNumber) (already correct)
        // 10. Teardown: Delete the created employee via DB
        if (empNumber) {
          test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
          await seedUtil.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    }
  );
});
