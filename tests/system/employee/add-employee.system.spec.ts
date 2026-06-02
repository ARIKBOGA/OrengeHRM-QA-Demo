import { test, expect }      from '@fixtures/base.fixture';
import { AddEmployeePage }   from '@pages/employee/add-employee.page';
import { InterceptorUtil }   from '@utils/api/interceptor.util';
import { DbAssertionUtil }   from '@utils/db/assertion.util';
import { SeedUtil }          from '@utils/db/seed.util';
import { createEmployee }    from '@data/factories/employee.factory';

/**
 * SYSTEM TEST — Add Employee
 * Layer:  System (UI + API interception + DB verification)
 * Scope:  Admin adds employee via UI → API called → DB updated.
 */
test.describe('Add Employee — System', () => {

  test('admin adds employee via UI, API responds 200, DB row created', async ({
    authenticatedPage, db
  }) => {
    const addPage    = new AddEmployeePage(authenticatedPage);
    const interceptor = new InterceptorUtil(authenticatedPage);
    const dbAssert   = new DbAssertionUtil(db);
    const seed       = new SeedUtil(db);
    const employee   = createEmployee({ firstName: 'SysTest' });

    interceptor.startCapturing(/\/api\/v2\/pim\/employees/);

    // ── Act ────────────────────────────────────────────────────────────────
    await addPage.navigate();
    await addPage.fillEmployeeForm(employee);
    await addPage.save();

    // ── Assert: UI toast ───────────────────────────────────────────────────
    await addPage.expectSaveSuccess();

    // ── Assert: background API was 200 ────────────────────────────────────
    expect(interceptor.getLastResponse()?.status()).toBe(200);

    // ── Assert: DB (local only) ────────────────────────────────────────────
    await dbAssert.expectRowExists('hs_hr_employee', {
      emp_firstname: employee.firstName,
    });

    // ── Cleanup ────────────────────────────────────────────────────────────
    await seed.cleanupEmployeeByFirstName(employee.firstName);
  });

});
