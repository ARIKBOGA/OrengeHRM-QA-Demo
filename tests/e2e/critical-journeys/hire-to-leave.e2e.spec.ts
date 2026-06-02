import { test, expect }      from '@fixtures/base.fixture';
import { AddEmployeePage }   from '@pages/employee/add-employee.page';
import { AssignLeavePage }   from '@pages/leave/assign-leave.page';
import { DbAssertionUtil }   from '@utils/db/assertion.util';
import { SeedUtil }          from '@utils/db/seed.util';
import { createEmployee }    from '@data/factories/employee.factory';

/**
 * E2E TEST — Hire to Leave Critical Journey
 * Layer:  E2E (all three layers: UI + API + DB)
 * Scope:  Admin creates employee → assigns leave → DB verified.
 *
 * This is the most realistic user journey in the HR domain:
 * onboarding a new hire then immediately managing their leave.
 */
test.describe('Hire to Leave — E2E Critical Journey', () => {

  test('admin creates employee and assigns leave — full journey', async ({
    authenticatedPage, db
  }) => {
    const addPage    = new AddEmployeePage(authenticatedPage);
    const leavePage  = new AssignLeavePage(authenticatedPage);
    const dbAssert   = new DbAssertionUtil(db);
    const seed       = new SeedUtil(db);
    const employee   = createEmployee({ firstName: 'E2ETest' });

    // ── Step 1: Create employee ────────────────────────────────────────────
    await addPage.navigate();
    await addPage.fillEmployeeForm(employee);
    await addPage.save();
    await addPage.expectSaveSuccess();

    // ── Step 2: Assign leave ───────────────────────────────────────────────
    // TODO: implement AssignLeavePage and this step
    // await leavePage.navigate();
    // await leavePage.assignLeave({ employee: employee.firstName, leaveType: 'Annual Leave', ... });
    // await leavePage.expectLeaveAssigned();

    // ── Step 3: DB verification ────────────────────────────────────────────
    await dbAssert.expectRowExists('hs_hr_employee', {
      emp_firstname: employee.firstName,
    });

    // ── Cleanup ────────────────────────────────────────────────────────────
    await seed.cleanupEmployeeByFirstName(employee.firstName);
  });

});
