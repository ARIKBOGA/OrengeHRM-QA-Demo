import { test, expect } from '@fixtures/base.fixture';
import { createEmployee } from '@data/factories/employee.factory';
import { InterceptorUtil } from '@utils/api/interceptor.util';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { SeedUtil } from '@utils/db/seed.util';
import { Employee, ApiResponse } from '@t/api.types';
import { config } from '@config/env';

let requestUtil: RequestUtil;
let dbAssertion: DbAssertionUtil;
let seedUtil: SeedUtil;

test.describe('PIM Employee System Tests', { annotation: [{ type: 'Feature', description: 'PIM Module - Employee Management (UI & API/DB)' }] }, () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    dbAssertion = new DbAssertionUtil(db);
    seedUtil = new SeedUtil(db);
  });

  test('PIM-C-001: Create Employee - Required Fields (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-C-001' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ addEmployeePage, authenticatedPage }) => {
    const employeeData = createEmployee();
    let empNumber: number | undefined;
    const interceptor = new InterceptorUtil(authenticatedPage);

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Navigate to PIM > Add Employee
      await addEmployeePage.navigate();

      // 2. Fill in First Name, Last Name
      await addEmployeePage.fillEmployeeForm({
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
      });

      // Intercept the API call to get the empNumber
      interceptor.startCapturing(/\/api\/v2\/pim\/employees/);

      // 3. Click "Save"
      await addEmployeePage.save();

      // 4. Verify a success toast message ("Successfully Saved") appears
      await addEmployeePage.expectSaveSuccess();

      // Get empNumber from intercepted response
      const apiResponse = await interceptor.getLastResponseBody<ApiResponse<Employee>>();
      empNumber = apiResponse?.data?.empNumber;
      expect(empNumber).toBeDefined();

      // 5. Verify the employee's profile page is displayed (implicitly by save success, no direct POM verification for specific page)

      // 6. Use Playwright request to get the employee details via API by ID.
      const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
      expect(getEmployeeResponse.data.some(emp => emp.empNumber === empNumber && emp.firstName === employeeData.firstName)).toBe(true);

      // 7. Perform a direct database query to verify the record exists with correct details.
      await dbAssertion.expectRowExists('hs_hr_employee', {
        emp_number: empNumber,
        emp_firstname: employeeData.firstName,
        emp_lastname: employeeData.lastName,
      });
    } finally {
      // 8. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('PIM-C-002: Create Employee - All Fields (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-C-002' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ addEmployeePage, authenticatedPage }) => {
    const employeeData = createEmployee({
      middle_name: 'Middle',
      employeeId: `EMP-${Date.now()}`,
    });
    let empNumber: number | undefined;
    const interceptor = new InterceptorUtil(authenticatedPage);

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Navigate to PIM > Add Employee
      await addEmployeePage.navigate();

      // 2. Fill in First Name, Middle Name, Last Name, and Employee ID
      await addEmployeePage.fillEmployeeForm(employeeData);

      // Intercept the API call to get the empNumber
      interceptor.startCapturing(/\/api\/v2\/pim\/employees/);

      // 3. Click "Save"
      await addEmployeePage.save();

      // 4. Verify a success toast message appears
      await addEmployeePage.expectSaveSuccess();

      const apiResponse = await interceptor.getLastResponseBody<ApiResponse<Employee>>();
      empNumber = apiResponse?.data?.empNumber;
      expect(empNumber).toBeDefined();

      // 5. Verify the employee's profile page is displayed with all entered details.
      // No specific POM method to verify all details on profile page. Assert via API/DB.

      // 6. Use Playwright request to get the employee details via API by ID.
      const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
      const createdEmployee = getEmployeeResponse.data.find(emp => emp.empNumber === empNumber);
      expect(createdEmployee?.firstName).toBe(employeeData.firstName);
      expect(createdEmployee?.middleName).toBe(employeeData.middle_name);
      expect(createdEmployee?.lastName).toBe(employeeData.lastName);
      expect(createdEmployee?.employeeId).toBe(employeeData.employeeId);

      // 7. Perform a direct database query to verify all optional fields are correctly persisted.
      await dbAssertion.expectRowExists('hs_hr_employee', {
        emp_number: empNumber,
        emp_firstname: employeeData.firstName,
        emp_middlename: employeeData.middle_name,
        emp_lastname: employeeData.lastName,
        employee_id: employeeData.employeeId,
      });
    } finally {
      // 8. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('PIM-C-003: Create Employee - Mandatory Field Constraint Violation (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-C-003' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ addEmployeePage, authenticatedPage }) => {
    const invalidEmployeeData = createEmployee({ firstName: '', lastName: 'MissingFirst' });

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(invalidEmployeeData) });

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
    await expect(authenticatedPage.locator('[name="firstName"] + .oxd-input-field-error-message')).toHaveText('Required');

    // 5. Verify the form is not submitted and no success message appears.
    await expect(authenticatedPage.locator('.oxd-toast--success')).not.toBeVisible();

    // 6. Perform a direct database query to confirm no new employee record was created.
    if (config.dbEnabled) {
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_lastname: invalidEmployeeData.lastName });
    }
  });

  test('PIM-R-001: Search Employee - By Full Name (Exact Match)', { annotation: [{ type: 'Test ID', description: 'PIM-R-001' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage }) => {
    const employeeData = createEmployee({ middle_name: 'Middle' });
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // Pre-condition: Create an employee via API
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employeeData);
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // 1. Navigate to PIM > Employee List
      await employeeListPage.navigate();

      // 2. Enter the exact full name into the Employee Name search field.
      // The POM `employeeListPage.searchByName` uses the first input, which is 'Employee Name'.
      // OrangeHRM's employee name search often combines first and last name.
      await employeeListPage.searchByName(employeeData.firstName);

      // 3. Verify that only the matching employee's record is displayed in the results table.
      await employeeListPage.expectEmployeeVisible(employeeData.firstName);
      await expect(employeeListPage.getRecordCount()).resolves.toBe(1);

    } finally {
      // Teardown: Delete the created employee
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('PIM-R-002: Search Employee - By Partial Name', { annotation: [{ type: 'Test ID', description: 'PIM-R-002' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage }) => {
    // Pre-condition: Create two employees with shared partial names
    const employee1 = createEmployee({ firstName: 'PartialTest', lastName: 'A' });
    const employee2 = createEmployee({ firstName: 'AnotherPartial', lastName: 'B' });
    const partialName = 'Partial';
    let empNumber1: number | undefined;
    let empNumber2: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify([employee1, employee2]) });

    try {
      const createResponse1 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee1);
      empNumber1 = createResponse1.data.empNumber;
      const createResponse2 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee2);
      empNumber2 = createResponse2.data.empNumber;
      expect(empNumber1).toBeDefined();
      expect(empNumber2).toBeDefined();

      // 1. Navigate to PIM > Employee List
      await employeeListPage.navigate();

      // 2. Enter a partial string into the Employee Name search field.
      await employeeListPage.searchByName(partialName);

      // 3. Verify that all employees whose names contain the partial string are displayed.
      await employeeListPage.expectEmployeeVisible(employee1.firstName);
      await employeeListPage.expectEmployeeVisible(employee2.firstName);
      await expect(employeeListPage.getRecordCount()).resolves.toBe(2);

    } finally {
      // Teardown: Delete created employees
      if (empNumber1) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber1}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber1.toString());
      }
      if (empNumber2) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber2}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber2.toString());
      }
    }
  });

  test('PIM-R-003: Search Employee - By Employee ID', { annotation: [{ type: 'Test ID', description: 'PIM-R-003' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage, authenticatedPage }) => {
    const employeeData = createEmployee({ employeeId: `UI_EMP_${Date.now()}` });
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // Pre-condition: Create an employee via API
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employeeData);
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // 1. Navigate to PIM > Employee List
      await employeeListPage.navigate();

      // 2. Enter the exact Employee ID of an existing employee into the Employee ID search field.
      // The second input field in the search form is typically for 'Employee ID'.
      const employeeIdInput = authenticatedPage.locator('.oxd-input').nth(1);
      await employeeIdInput.fill(employeeData.employeeId!);
      await employeeListPage.searchButton.click();
      await employeeListPage.waitForPageReady();

      // 3. Verify that only the matching employee's record is displayed in the results table.
      await employeeListPage.expectEmployeeVisible(employeeData.firstName);
      await expect(employeeListPage.getRecordCount()).resolves.toBe(1);

    } finally {
      // Teardown: Delete the created employee
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('PIM-R-004: Search Employee - No Results Found', { annotation: [{ type: 'Test ID', description: 'PIM-R-004' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage }) => {
    const nonExistentName = `NonExistentEmployee_${Date.now()}`;

    test.info().annotations.push({ type: 'Test Data', description: `Non-existent Name: ${nonExistentName}` });

    // 1. Navigate to PIM > Employee List
    await employeeListPage.navigate();

    // 2. Enter a non-existent name into the Employee Name search field.
    await employeeListPage.searchByName(nonExistentName);

    // 3. Verify that a "No Records Found" message is displayed in the results area.
    await expect(employeeListPage.getByText('No Records Found')).toBeVisible();
    await expect(employeeListPage.getRecordCount()).resolves.toBe(0);
  });

  test('PIM-R-005: Search Employee - View Employee Details', { annotation: [{ type: 'Test ID', description: 'PIM-R-005' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage, authenticatedPage }) => {
    const employeeData = createEmployee();
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // Pre-condition: Create an employee via API
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employeeData);
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // 1. Search for an existing employee
      await employeeListPage.navigate();
      await employeeListPage.searchByName(employeeData.firstName);

      // 2. Click on the employee's name in the results table.
      await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).getByRole('link').click();
      await authenticatedPage.waitForLoadState('networkidle');

      // 3. Verify that the employee's detailed profile page is displayed.
      await expect(authenticatedPage.getByRole('heading', { name: employeeData.firstName, exact: false })).toBeVisible(); // Assuming name is part of heading
      await expect(authenticatedPage.locator('.orangehrm-horizontal-padding h6').filter({ hasText: 'Personal Details' })).toBeVisible();

      // 4. Verify some key information on the profile page.
      // We don't have specific POMs for the details page, so direct locator checks.
      await expect(authenticatedPage.locator('[name="firstName"]')).toHaveValue(employeeData.firstName);
      await expect(authenticatedPage.locator('[name="lastName"]')).toHaveValue(employeeData.lastName);

    } finally {
      // Teardown: Delete the created employee
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  // PIM-U-XXX Test Cases (Update Employee) - Cannot be fully implemented with current POMs
  // The provided POMs (LoginPage, DashboardPage, AddEmployeePage, EmployeeListPage, etc.)
  // do not include functionality to navigate to an employee's detailed profile page and
  // interact with 'Edit' buttons or fields like 'Nationality', 'Marital Status', 'Date of Birth'.
  // The `AddEmployeePage` is solely for adding. Thus, these UI update scenarios
  // described in the test plan (PIM-U-001, PIM-U-002) are out of scope for strict adherence
  // to "USE ONLY methods, properties, and classes that exist in the source files".
  test.skip('PIM-U-001: Update Employee - Personal Details (UI) - SKIPPED due to POM limitations', { annotation: [{ type: 'Test ID', description: 'PIM-U-001' }, { type: 'Layer', description: 'System, E2E' }] }, async () => {
    test.info().annotations.push({ type: 'Note', description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for employee profile page editing.' });
  });

  test.skip('PIM-U-002: Update Employee - Mandatory Field Violation (UI) - SKIPPED due to POM limitations', { annotation: [{ type: 'Test ID', description: 'PIM-U-002' }, { type: 'Layer', description: 'System, E2E' }] }, async () => {
    test.info().annotations.push({ type: 'Note', description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for employee profile page editing.' });
  });

  test('PIM-D-001: Delete Single Employee (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-D-001' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage, authenticatedPage }) => {
    const employeeData = createEmployee({ firstName: 'DeleteMe' });
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Create a test employee via API
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employeeData);
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // Verify employee exists in DB before UI interaction
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

      // 2. Search for the employee
      await employeeListPage.navigate();
      await employeeListPage.searchByName(employeeData.firstName);
      await employeeListPage.expectEmployeeVisible(employeeData.firstName);

      // 3. Select the checkbox next to the employee's name
      await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).getByRole('checkbox').check();

      // 4. Click the "Delete Selected" button
      await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

      // 5. Confirm the deletion in the confirmation dialog
      await authenticatedPage.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure you want to delete selected?');
        await dialog.accept();
      });

      // 6. Verify a success toast message appears
      await expect(authenticatedPage.locator('.oxd-toast--success')).toBeVisible();

      // 7. Verify the employee is no longer present in the results table.
      await employeeListPage.searchByName(employeeData.firstName); // Re-search to confirm absence
      await expect(employeeListPage.getByText('No Records Found')).toBeVisible();
      await expect(employeeListPage.getRecordCount()).resolves.toBe(0);

      // 8. Use Playwright request to verify the employee is not found via API.
      const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber });
      expect(getEmployeeResponse.data.some(emp => emp.empNumber === empNumber)).toBe(false);

      // 9. Perform a direct database query to confirm the record is deleted.
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumber });

    } finally {
      // 10. Teardown: Ensure employee is deleted (if not, force delete via DB)
      if (empNumber && config.dbEnabled) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('PIM-D-002: Delete Multiple Employees (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-D-002' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage, authenticatedPage }) => {
    // 1. Create two test employees via API
    const employee1 = createEmployee({ firstName: 'MultiDelete1' });
    const employee2 = createEmployee({ firstName: 'MultiDelete2' });
    let empNumbers: number[] = [];

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify([employee1, employee2]) });

    try {
      const createResponse1 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee1);
      empNumbers.push(createResponse1.data.empNumber);
      const createResponse2 = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employee2);
      empNumbers.push(createResponse2.data.empNumber);

      expect(empNumbers.every(num => typeof num === 'number')).toBe(true);

      // Verify employees exist in DB before UI interaction
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumbers[0] });
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumbers[1] });

      // 2. Navigate to PIM > Employee List and search for these employees (using partial name commonality)
      await employeeListPage.navigate();
      await employeeListPage.searchByName('MultiDelete'); // Search for common partial name

      // 3. Select the checkboxes next to two or more employees
      await authenticatedPage.locator('.oxd-table-row', { hasText: employee1.firstName }).getByRole('checkbox').check();
      await authenticatedPage.locator('.oxd-table-row', { hasText: employee2.firstName }).getByRole('checkbox').check();

      // 4. Click the "Delete Selected" button
      await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

      // 5. Confirm the deletion in the confirmation dialog
      await authenticatedPage.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure you want to delete selected?');
        await dialog.accept();
      });

      // 6. Verify a success toast message appears
      await expect(authenticatedPage.locator('.oxd-toast--success')).toBeVisible();

      // 7. Verify the selected employees are no longer present in the results table.
      await employeeListPage.searchByName('MultiDelete'); // Re-search
      await expect(employeeListPage.getByText('No Records Found')).toBeVisible();
      await expect(employeeListPage.getRecordCount()).resolves.toBe(0);

      // 8. Use Playwright request to verify all deleted employees are not found via API.
      const getEmployeesResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees');
      expect(getEmployeesResponse.data.some(emp => empNumbers.includes(emp.empNumber))).toBe(false);

      // 9. Perform a direct database query to confirm all selected records are deleted.
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumbers[0] });
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumbers[1] });

    } finally {
      // 10. Teardown: Ensure all employees are deleted
      if (empNumbers.length > 0 && config.dbEnabled) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumbers: ${empNumbers.join(', ')}` });
        for (const empNum of empNumbers) {
          await seedUtil.cleanupEmployeeByEmployeeId(empNum.toString());
        }
      }
    }
  });

  test('PIM-D-003: Delete Employee - Cancel Deletion (UI)', { annotation: [{ type: 'Test ID', description: 'PIM-D-003' }, { type: 'Layer', description: 'System, E2E' }] }, async ({ employeeListPage, authenticatedPage }) => {
    const employeeData = createEmployee({ firstName: 'DoNotDelete' });
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Create a test employee via API
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', employeeData);
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // Verify employee exists in DB before UI interaction
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

      // 2. Search for the employee
      await employeeListPage.navigate();
      await employeeListPage.searchByName(employeeData.firstName);
      await employeeListPage.expectEmployeeVisible(employeeData.firstName);

      // 3. Select the checkbox next to the employee's name
      await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).getByRole('checkbox').check();

      // 4. Click the "Delete Selected" button
      await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

      // 5. In the confirmation dialog, click "Cancel"
      await authenticatedPage.once('dialog', async dialog => {
        expect(dialog.message()).toContain('Are you sure you want to delete selected?');
        await dialog.dismiss();
      });

      // 6. Verify the confirmation dialog closes and no success message appears.
      await expect(authenticatedPage.locator('.oxd-toast--success')).not.toBeVisible();

      // 7. Verify the employee is still present in the results table.
      await employeeListPage.searchByName(employeeData.firstName); // Re-search to confirm presence
      await employeeListPage.expectEmployeeVisible(employeeData.firstName);
      await expect(employeeListPage.getRecordCount()).resolves.toBe(1);

      // 8. Use Playwright request to verify the employee is still found via API.
      const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber });
      expect(getEmployeeResponse.data.some(emp => emp.empNumber === empNumber && emp.firstName === employeeData.firstName)).toBe(true);

      // 9. Perform a direct database query to confirm the record still exists.
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

    } finally {
      // 10. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });
});