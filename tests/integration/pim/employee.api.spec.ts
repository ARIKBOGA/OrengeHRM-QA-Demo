import { test, expect } from '@fixtures/base.fixture';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { SeedUtil } from '@utils/db/seed.util';
import { createEmployee } from '@data/factories/employee.factory';
import type { ApiResponse, Employee, EmployeePersonalDetails, UpdatePersonalDetailsPayload } from '@t/api.types';
import { config } from '@config/env';

let requestUtil: RequestUtil;
let dbAssert: DbAssertionUtil;
let seed: SeedUtil;

test.describe(
  'PIM Employee API CRUD',
  {
    annotation: [{ type: 'Feature', description: 'PIM Module - Employee Management (API)' }],
  },
  () => {
    test.beforeEach(async ({ authenticatedApi, db }) => {
      requestUtil = new RequestUtil(authenticatedApi);
      dbAssert = new DbAssertionUtil(db);
      seed = new SeedUtil(db);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE
    // ─────────────────────────────────────────────────────────────────────────

    test(
      'CRUD-API-001: Create Employee — minimum required fields',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-001' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const employee = createEmployee();
        let empNumber: number | undefined;

        test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employee) });

        try {
          const response = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
            firstName: employee.firstName,
            lastName: employee.lastName,
          });

          empNumber = response.data.empNumber;
          expect(empNumber).toBeDefined();
          expect(response.data.firstName).toBe(employee.firstName);
          expect(response.data.lastName).toBe(employee.lastName);

          await dbAssert.expectRowExists('hs_hr_employee', {
            emp_number: empNumber,
            emp_firstname: employee.firstName,
            emp_lastname: employee.lastName,
          });
        } finally {
          if (empNumber) await seed.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    );

    test(
      'CRUD-API-002: Create Employee — all fields including middleName',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-002' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const employee = createEmployee();
        const middleName = 'Middle';
        let empNumber: number | undefined;

        test.info().annotations.push({ type: 'Test Data', description: JSON.stringify(employee) });

        try {
          const response = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
            firstName: employee.firstName,
            lastName: employee.lastName,
            middleName, // API field: camelCase
          });

          empNumber = response.data.empNumber;
          expect(empNumber).toBeDefined();
          expect(response.data.firstName).toBe(employee.firstName);
          expect(response.data.lastName).toBe(employee.lastName);
          expect(response.data.middleName).toBe(middleName);
          expect(response.data.employeeId).toBeNull(); // OrangeHRM auto-assigns, not settable via POST

          await dbAssert.expectRowExists('hs_hr_employee', {
            emp_number: empNumber,
            emp_firstname: employee.firstName,
            emp_lastname: employee.lastName,
            emp_middle_name: middleName, // DB column: snake_case
          });
        } finally {
          if (empNumber) await seed.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    );

    test(
      'CRUD-API-003: Create Employee — missing firstName returns 4xx',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-003' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const uniqueLastName = `Invalid_${Date.now()}`;

        const response = await requestUtil.postRaw('/api/v2/pim/employees', { firstName: '', lastName: uniqueLastName });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);

        // DB'de kayıt oluşmamalı
        if (config.dbEnabled) {
          await dbAssert.expectRowCount('hs_hr_employee', 0, { emp_lastname: uniqueLastName });
        }
      }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────────────

    test(
      'CRUD-API-004: Update Employee — personal details',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-004' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const employee = createEmployee();
        let empNumber: number | undefined;

        try {
          // Setup: create employee
          const created = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
            firstName: employee.firstName,
            lastName: employee.lastName,
          });
          empNumber = created.data.empNumber;
          expect(empNumber).toBeDefined();

          // Act: update personal details — all fields
          const updatedLastName = 'SmithUpdated'; // sabit, kısa, max 30 char
          const updatedMiddleName = 'UpdatedMiddle';
          const payload: UpdatePersonalDetailsPayload = {
            firstName: employee.firstName,
            lastName: updatedLastName,
            middleName: updatedMiddleName,
            otherId: 'OTH-001',
            drivingLicenseNo: 'DL-123456',
            drivingLicenseExpiredDate: '2030-12-31',
            gender: 1,
            maritalStatus: 'single',
            birthday: '1990-01-15',
            nationalityId: 4,
          };

          const updated = await requestUtil.put<ApiResponse<EmployeePersonalDetails>>(`/api/v2/pim/employees/${empNumber}/personal-details`, payload);

          expect(updated.data.lastName).toBe(updatedLastName);
          expect(updated.data.middleName).toBe(updatedMiddleName);

          // Assert: API response
          expect(updated.data.lastName).toBe(payload.lastName);
          expect(updated.data.middleName).toBe('UpdatedMiddle');
          expect(updated.data.otherId).toBe('OTH-001');
          expect(updated.data.drivingLicenseNo).toBe('DL-123456');
          expect(updated.data.drivingLicenseExpiredDate).toBe('2030-12-31');
          expect(updated.data.gender).toBe(1);
          expect(updated.data.maritalStatus).toBe('single');
          expect(updated.data.birthday).toBe('1990-01-15');
          expect(updated.data.nationality.id).toBe(4);

          // Assert: DB
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_lastname', payload.lastName!);
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_middle_name', 'UpdatedMiddle');
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_dri_lice_num', 'DL-123456');
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_gender', 1);
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'nation_code', 4);
        } finally {
          if (empNumber) await seed.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    );

    test(
      'CRUD-API-005: Update Employee — empty firstName returns 4xx',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-005' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const employee = createEmployee();
        let empNumber: number | undefined;

        try {
          // Setup: create employee
          const created = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
            firstName: employee.firstName,
            lastName: employee.lastName,
          });
          empNumber = created.data.empNumber;
          expect(empNumber).toBeDefined();

          // Act: attempt invalid update
          const response = await requestUtil.putRaw(`/api/v2/pim/employees/${empNumber}/personal-details`, { firstName: '', lastName: employee.lastName });

          // Assert: 4xx
          expect(response.status()).toBeGreaterThanOrEqual(400);
          expect(response.status()).toBeLessThan(500);

          // Assert: DB unchanged
          await dbAssert.expectFieldValue('hs_hr_employee', { emp_number: empNumber }, 'emp_firstname', employee.firstName);
        } finally {
          if (empNumber) await seed.cleanupEmployeeByEmpNumber(empNumber);
        }
      }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────

    test(
      'CRUD-API-006: Delete Employee — success',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-006' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const employee = createEmployee();
        let empNumber: number | undefined;

        try {
          // Setup: create employee
          const created = await requestUtil.post<ApiResponse<Employee>>('/api/v2/pim/employees', {
            firstName: employee.firstName,
            lastName: employee.lastName,
          });
          empNumber = created.data.empNumber;
          expect(empNumber).toBeDefined();

          // Pre-delete DB check
          await dbAssert.expectRowExists('hs_hr_employee', { emp_number: empNumber });

          // Act: delete
          await requestUtil.delete('/api/v2/pim/employees', { ids: [empNumber] });

          // Assert: DB'de yok
          await dbAssert.expectRowCount('hs_hr_employee', 0, { emp_number: empNumber });
        } finally {
          // delete başarısız olduysa DB'den temizle
          if (empNumber) await seed.cleanupEmployeeByEmpNumber(empNumber).catch(() => {});
        }
      }
    );

    test(
      'CRUD-API-007: Delete Employee — non-existent returns 4xx',
      {
        annotation: [
          { type: 'Test ID', description: 'CRUD-API-007' },
          { type: 'Layer', description: 'Integration' },
        ],
      },
      async () => {
        const nonExistentId = 999999999;

        const response = await requestUtil.deleteRaw('/api/v2/pim/employees', { ids: [nonExistentId] });

        // OrangeHRM non-existent ID için 404 dönüyor
        expect(response.status()).toBe(404);
      }
    );
  }
);
