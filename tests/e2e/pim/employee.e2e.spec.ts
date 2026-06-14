import { test, expect } from '@fixtures/base.fixture';
import { createEmployee } from '@data/factories/employee.factory';
import { InterceptorUtil } from '@utils/api/interceptor.util';
import { RequestUtil } from '@utils/api/request.util';
import { SeedUtil } from '@utils/db/seed.util';
import { Employee, ApiResponse } from '@t/api.types';
import { config } from '@config/env';

let requestUtil: RequestUtil;
let seedUtil: SeedUtil;

test.describe('PIM Employee E2E Scenarios', { annotation: [{ type: 'Feature', description: 'PIM Module - Employee Management (End-to-End User Journeys)' }] }, () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    seedUtil = new SeedUtil(db);
  });

  test('E2E-001: Full Employee Lifecycle (Create, Read, Delete)', { annotation: [{ type: 'Test ID', description: 'E2E-001' }, { type: 'Layer', description: 'E2E' }] }, async ({ addEmployeePage, employeeListPage, authenticatedPage }) => {
    const employeeData = createEmployee({ middle_name: 'E2E', employeeId: `E2E_${Date.now()}` });
    let empNumber: number | undefined;
    const interceptor = new InterceptorUtil(authenticatedPage);

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // --- CREATE EMPLOYEE ---
      test.step('Step 1: Create a new employee via UI', async () => {
        await addEmployeePage.navigate();
        await addEmployeePage.fillEmployeeForm(employeeData);
        interceptor.startCapturing(/\/api\/v2\/pim\/employees/);
        await addEmployeePage.save();
        await addEmployeePage.expectSaveSuccess();

        const apiResponse = await interceptor.getLastResponseBody<ApiResponse<Employee>>();
        empNumber = apiResponse?.data?.empNumber;
        expect(empNumber).toBeDefined();
        test.info().annotations.push({ type: 'Employee Created', description: `empNumber: ${empNumber}` });
      });

      // --- READ/SEARCH EMPLOYEE ---
      test.step('Step 2: Search for the newly created employee', async () => {
        await employeeListPage.navigate();
        await employeeListPage.searchByName(employeeData.firstName);
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);
        await expect(employeeListPage.getRecordCount()).resolves.toBe(1);
      });

      // --- VIEW EMPLOYEE DETAILS (Partial - as update is skipped) ---
      test.step('Step 3: View employee details', async () => {
        // Find the employee in the table and click on their name to navigate to details page
        await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).getByRole('link').click();
        await authenticatedPage.waitForLoadState('networkidle');
        // Verify we are on the employee's detailed profile page
        await expect(authenticatedPage.getByRole('heading', { name: employeeData.firstName, exact: false })).toBeVisible();
        await expect(authenticatedPage.locator('.orangehrm-horizontal-padding h6').filter({ hasText: 'Personal Details' })).toBeVisible();
        // Verify key details are displayed
        await expect(authenticatedPage.locator('[name="firstName"]')).toHaveValue(employeeData.firstName);
        await expect(authenticatedPage.locator('[name="lastName"]')).toHaveValue(employeeData.lastName);
      });

      // --- DELETE EMPLOYEE ---
      test.step('Step 4: Delete the employee via UI', async () => {
        // Navigate back to employee list to perform deletion
        await employeeListPage.navigate();

        // Search for the employee to ensure it's on screen and selectable
        await employeeListPage.searchByName(employeeData.firstName);
        await employeeListPage.expectEmployeeVisible(employeeData.firstName);

        await authenticatedPage.locator('.oxd-table-row', { hasText: employeeData.firstName }).getByRole('checkbox').check();
        await authenticatedPage.getByRole('button', { name: 'Delete Selected' }).click();

        await authenticatedPage.once('dialog', async dialog => {
          expect(dialog.message()).toContain('Are you sure you want to delete selected?');
          await dialog.accept();
        });

        await expect(authenticatedPage.locator('.oxd-toast--success')).toBeVisible();
        test.info().annotations.push({ type: 'Employee Deleted', description: `empNumber: ${empNumber}` });
      });

      // --- VERIFY DELETION ---
      test.step('Step 5: Verify employee is no longer listed in UI and not found via API', async () => {
        await employeeListPage.searchByName(employeeData.firstName);
        await expect(employeeListPage.getByText('No Records Found')).toBeVisible();

        const getEmployeeResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
        expect(getEmployeeResponse.data.some(emp => emp.empNumber === empNumber)).toBe(false);
      });

    } finally {
      // Teardown: Ensure employee is deleted
      if (empNumber && config.dbEnabled) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('E2E-002: Create Employee - Mandatory Field Validation (UI E2E)', { annotation: [{ type: 'Test ID', description: 'E2E-002' }, { type: 'Layer', description: 'E2E' }] }, async ({ addEmployeePage, authenticatedPage, employeeListPage }) => {
    const invalidEmployeeData = createEmployee({ firstName: '', lastName: 'MissingLastName' }); // Missing first name

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(invalidEmployeeData) });

    test.step('Step 1: Navigate to Add Employee page and attempt to create with missing mandatory field', async () => {
      await addEmployeePage.navigate();
      await addEmployeePage.fillEmployeeForm({
        firstName: invalidEmployeeData.firstName, // Empty string
        lastName: invalidEmployeeData.lastName,
      });
      await authenticatedPage.getByRole('button', { name: 'Save' }).click();
    });

    test.step('Step 2: Verify inline error message and no success toast', async () => {
      await expect(authenticatedPage.locator('[name="firstName"] + .oxd-input-field-error-message')).toHaveText('Required');
      await expect(authenticatedPage.locator('.oxd-toast--success')).not.toBeVisible();
    });

    // Verification that no record was created by attempting to search for it.
    test.step('Step 3: Verify employee is not created by attempting to search for it', async () => {
      await authenticatedPage.goto('/web/index.php/pim/viewEmployeeList'); // Navigate to list to search
      await employeeListPage.employeeNameInput.fill(invalidEmployeeData.lastName);
      await employeeListPage.searchButton.click();
      await employeeListPage.waitForPageReady();
      await expect(authenticatedPage.getByText('No Records Found')).toBeVisible();
    });
  });

  // PIM-U-XXX (Update) related E2E tests are also skipped due to POM limitations.
  test.skip('E2E-003: Update Employee Lifecycle (SKIPPED due to POM limitations)', { annotation: [{ type: 'Test ID', description: 'E2E-003' }, { type: 'Layer', description: 'E2E' }] }, async () => {
    test.info().annotations.push({ type: 'Note', description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for employee profile page editing.' });
  });

  // Pagination functionality verification is outside the scope of current POMs for explicit interaction.
  test.skip('E2E-004: Employee List Pagination (SKIPPED due to POM limitations)', { annotation: [{ type: 'Test ID', description: 'E2E-004' }, { type: 'Layer', description: 'E2E' }] }, async () => {
    test.info().annotations.push({ type: 'Note', description: 'Skipped: Cannot implement with current POMs. Requires specific POMs/methods for pagination controls.' });
  });
});