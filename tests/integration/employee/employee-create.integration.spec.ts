import { test, expect }      from '@fixtures/base.fixture';
import { RequestUtil }       from '@utils/api/request.util';
import { DbAssertionUtil }   from '@utils/db/assertion.util';
import { createEmployee }    from '@data/factories/employee.factory';
import type { ApiResponse, Employee } from '@t/api.types';

/**
 * INTEGRATION TEST — Employee Creation
 * Layer:  Integration
 * Scope:  API call → verify DB state
 * No UI involved.
 */
test.describe('Employee Creation — Integration', () => {

  test('POST /pim/employees persists employee in DB', async ({
    authenticatedApi, db
  }) => {
    const api      = new RequestUtil(authenticatedApi);
    const dbAssert = new DbAssertionUtil(db);
    const employee = createEmployee({ firstName: 'IntTest' });

    // ── Act ──────────────────────────────────────────────────────────────
    const response = await api.post<ApiResponse<Employee>>('/pim/viewEmployeeList', {
      firstName:  employee.firstName,
      middleName: '',
      lastName:   employee.lastName,
    });

    // ── Assert: API response ──────────────────────────────────────────────
    expect(response.data.empNumber).toBeDefined();
    expect(response.data.firstName).toBe(employee.firstName);

    // ── Assert: DB row exists (local only, no-op in staging) ──────────────
    await dbAssert.expectRowExists('hs_hr_employee', {
      emp_number: response.data.empNumber,
    });
  });

});
