import { test, expect } from '@fixtures/base.fixture';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { SeedUtil } from '@utils/db/seed.util';
import { createEmployee } from '@data/factories/employee.factory';
import { Employee, ApiResponse } from '@t/api.types';
import { config } from '@config/env';

let requestUtil: RequestUtil;
let dbAssertion: DbAssertionUtil;
let seedUtil: SeedUtil;

test.describe('PIM Employee API CRUD', { annotation: [{ type: 'Feature', description: 'PIM Module - Employee Management (API)' }] }, () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    dbAssertion = new DbAssertionUtil(db);
    seedUtil = new SeedUtil(db);
  });

  test('CRUD-API-001: Create Employee (API) - Minimum Required Fields', { annotation: [{ type: 'Test ID', description: 'CRUD-API-001' }, { type: 'Layer', description: 'Integration' }] }, async () => {
    const employeeData = createEmployee();
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Construct payload & 2. Send POST request
      const response = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
      });

      // 3. Verify API response status code is 200 (Rule 7)
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('empNumber');
      empNumber = response.data.empNumber;

      // 4. Parse response body and extract empNumber
      expect(empNumber).toBeDefined();
      expect(response.data.firstName).toBe(employeeData.firstName);
      expect(response.data.lastName).toBe(employeeData.lastName);

      // 5. Perform direct database query to confirm record exists
      await dbAssertion.expectRowExists('hs_hr_employee', {
        emp_number: empNumber,
        emp_firstname: employeeData.firstName,
        emp_lastname: employeeData.lastName,
      });
      await dbAssertion.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_lastname', employeeData.lastName);
    } finally {
      // 6. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('CRUD-API-002: Create Employee (API) - All Fields', { annotation: [{ type: 'Test ID', description: 'CRUD-API-002' }, { type: 'Layer', description: 'Integration' }] }, async () => {
    const employeeData = createEmployee({
      middleName: 'Middle',
      employeeId: `EMP-${Date.now()}`, // Explicit employee ID
    });
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      // 1. Construct payload & 2. Send POST request
      const response = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
        firstName: employeeData.firstName,
        middleName: employeeData.middleName,
        lastName: employeeData.lastName,
        employeeId: employeeData.employeeId,
      });

      // 3. Verify API response status code is 200 (Rule 7)
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('empNumber');
      empNumber = response.data.empNumber;

      // 4. Parse response body and extract empNumber
      expect(empNumber).toBeDefined();
      expect(response.data.firstName).toBe(employeeData.firstName);
      expect(response.data.middleName).toBe(employeeData.middleName);
      expect(response.data.lastName).toBe(employeeData.lastName);
      expect(response.data.employeeId).toBe(employeeData.employeeId);

      // 5. Perform direct database query to confirm record exists with all provided fields.
      await dbAssertion.expectRowExists('hs_hr_employee', {
        emp_number: empNumber,
        emp_firstname: employeeData.firstName,
        emp_middlename: employeeData.middleName,
        emp_lastname: employeeData.lastName,
        employee_id: employeeData.employeeId,
      });
    } finally {
      // 6. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('CRUD-API-003: Create Employee (API) - Mandatory Field Violation', { annotation: [{ type: 'Test ID', description: 'CRUD-API-003' }, { type: 'Layer', description: 'Integration' }] }, async ({ authenticatedApi }) => {
    const employeeData = createEmployee({ firstName: '', lastName: 'Invalid' }); // Missing first name

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    // 1. Construct invalid JSON payload & 2. Send POST request
    const response = await authenticatedApi.post('/api/v2/pim/employees', {
      data: {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
      },
    });

    // 3. Verify the API response status code is 4xx
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    // 4. Verify the response body contains an appropriate error message
    const responseBody = await response.json();
    expect(responseBody.message).toContain('First Name cannot be null'); // Assuming specific error message

    // 5. Perform direct database query to confirm no new employee record was created
    if (config.dbEnabled) { // Conditional check for DB_ENABLED
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_lastname: employeeData.lastName });
    }
  });

  test('CRUD-API-004: Update Employee (API) - Personal Details', { annotation: [{ type: 'Test ID', description: 'CRUD-API-004' }, { type: 'Layer', description: 'Integration' }] }, async () => {
    // Pre-requisite: Create an employee
    const originalEmployeeData = createEmployee();
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Original Test Data', description: JSON.stringify(originalEmployeeData) });

    try {
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
        firstName: originalEmployeeData.firstName,
        lastName: originalEmployeeData.lastName,
      });
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // 2. Construct PUT request payload with updated personal details
      const updatedLastName = `${originalEmployeeData.lastName}_Updated`;
      const updatedMiddleName = 'UpdatedMiddle';

      const updatePayload = {
        empNumber: empNumber, // OrangeHRM API might require empNumber in body for PUT
        firstName: originalEmployeeData.firstName, // Keep first name
        lastName: updatedLastName,
        middleName: updatedMiddleName,
      };

      test.info().annotations.push({ type: 'Update Payload', description: JSON.stringify(updatePayload) });

      // 3. Send the PUT request
      const updateResponse = await requestUtil.put<ApiResponse<Employee>>(`/api/v2/pim/employees/${empNumber}`, updatePayload);

      // 4. Verify the API response status code is 200 OK (Rule 7)
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.lastName).toBe(updatedLastName);
      expect(updateResponse.data.middleName).toBe(updatedMiddleName);

      // 6. Perform a direct database query to confirm the changes are reflected
      await dbAssertion.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_lastname', updatedLastName);
      await dbAssertion.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_middlename', updatedMiddleName);

    } finally {
      // 7. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('CRUD-API-005: Update Employee (API) - Mandatory Field Violation', { annotation: [{ type: 'Test ID', description: 'CRUD-API-005' }, { type: 'Layer', description: 'Integration' }] }, async ({ authenticatedApi }) => {
    // Pre-requisite: Create an employee
    const originalEmployeeData = createEmployee();
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Original Test Data', description: JSON.stringify(originalEmployeeData) });

    try {
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
        firstName: originalEmployeeData.firstName,
        lastName: originalEmployeeData.lastName,
      });
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // 2. Construct PUT request payload setting a mandatory field to empty string
      const invalidUpdatePayload = {
        empNumber: empNumber,
        firstName: '', // Invalid: setting mandatory first name to empty
        lastName: originalEmployeeData.lastName,
      };

      test.info().annotations.push({ type: 'Invalid Update Payload', description: JSON.stringify(invalidUpdatePayload) });

      // 3. Send the PUT request
      const updateResponse = await authenticatedApi.put(`/api/v2/pim/employees/${empNumber}`, { data: invalidUpdatePayload });

      // 4. Verify the API response status code is 4xx
      expect(updateResponse.status()).toBeGreaterThanOrEqual(400);
      expect(updateResponse.status()).toBeLessThan(500);

      // 5. Verify the response body contains an appropriate error message
      const responseBody = await updateResponse.json();
      expect(responseBody.message).toContain('First Name cannot be null'); // Assuming specific error message

      // 6. Perform a direct database query to confirm the employee record *was not* updated
      await dbAssertion.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_firstname', originalEmployeeData.firstName);
    } finally {
      // 7. Teardown: Delete the created employee via DB
      if (empNumber) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Deleting employee with empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('CRUD-API-006: Delete Employee (API) - Success', { annotation: [{ type: 'Test ID', description: 'CRUD-API-006' }, { type: 'Layer', description: 'Integration' }] }, async () => {
    // Pre-requisite: Create an employee
    const employeeData = createEmployee();
    let empNumber: number | undefined;

    test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employeeData) });

    try {
      const createResponse = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
      });
      empNumber = createResponse.data.empNumber;
      expect(empNumber).toBeDefined();

      // Verify employee exists in DB before deletion
      await dbAssertion.expectRowExists('hs_hr_employee', { emp_number: empNumber });

      // 3. Send POST request with { ids: [empNumber] } for deletion (Rule 8)
      const deleteResponse: Response = await requestUtil.post('/api/v2/pim/employees', { ids: [empNumber] });

      // 4. Verify API response status code is 200 OK (Rule 7)
      expect(deleteResponse.status).toBe(200);

      // 5. Send a GET request to verify it's no longer found
      // The API provides a GET list endpoint with filtering by empNumber.
      const getResponse = await requestUtil.get<ApiResponse<Employee[]>>('/api/v2/pim/employees', { empNumber: empNumber! });
      expect(getResponse.data.some((emp: Employee) => emp.empNumber === empNumber)).toBe(false);

      // 6. Perform a direct database query to confirm the record is deleted
      await dbAssertion.expectRowCount('hs_hr_employee', 0, { emp_number: empNumber });

    } finally {
      // Ensure cleanup in case of test failure before deletion step
      // The cleanup ensures the test is idempotent if an earlier step failed.
      if (empNumber && config.dbEnabled) {
        test.info().annotations.push({ type: 'Teardown Action', description: `Final cleanup for empNumber: ${empNumber}` });
        await seedUtil.cleanupEmployeeByEmployeeId(empNumber.toString());
      }
    }
  });

  test('CRUD-API-007: Delete Employee (API) - Non-existent Employee', { annotation: [{ type: 'Test ID', description: 'CRUD-API-007' }, { type: 'Layer', description: 'Integration' }] }, async ({ authenticatedApi }) => {
    // 1. Generate a non-existent empNumber
    const nonExistentEmpNumber = 999999999; // Assume this ID does not exist

    test.info().annotations.push({ type: 'Test Data', description: `Non-existent empNumber: ${nonExistentEmpNumber}` });

    // 2. Send POST request with { ids: [nonExistentEmpNumber] } for deletion (Rule 8)
    const deleteResponse = await authenticatedApi.post('/api/v2/pim/employees', { data: { ids: [nonExistentEmpNumber] } });

    // 3. Verify the API response status code is 200 OK (Rule 7)
    // For batch delete operations, it's common to return 200 even if some IDs are not found,
    // and indicate the actual deleted count in the response body.
    expect(deleteResponse.status()).toBe(200);
    const responseBody = await deleteResponse.json();
    // Assuming the API returns a meta object with total count of deleted items.
    expect(responseBody.meta?.total).toBe(0); // Expecting 0 items deleted
  });
});