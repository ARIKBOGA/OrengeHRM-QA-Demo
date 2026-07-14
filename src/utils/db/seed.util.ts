import { DbQueryUtil } from './query.util';
import { config } from '@config/env';

/**
 * Seed Utility — test data setup and teardown helpers.
 * Only active in local/QA env (DB_ENABLED=true).
 */
export class SeedUtil {
  constructor(private readonly db: DbQueryUtil) {}

  async cleanupEmployeeByFirstName(firstName: string): Promise<void> {
    if (!config.dbEnabled) return;
    await this.db.query(`DELETE FROM hs_hr_employee WHERE emp_firstname = ?`, [firstName]);
  }

  async cleanupEmployeeByEmployeeId(employeeId: string): Promise<void> {
    if (!config.dbEnabled) return;
    await this.db.query(`DELETE FROM hs_hr_employee WHERE employee_id = ?`, [employeeId]);
  }

  async cleanupEmployeeByEmpNumber(empNumber: number): Promise<void> {
    if (!config.dbEnabled) return;
    await this.db.query('DELETE FROM hs_hr_employee WHERE emp_number = ?', [empNumber]);
  }

  async cleanupLeaveRequest(leaveRequestId: number): Promise<void> {
    if (!config.dbEnabled) return;
    // FK cascade (ohrm_leave.leave_request_id → ohrm_leave_request.id, ON DELETE CASCADE)
    // automatically removes the associated ohrm_leave rows too.
    await this.db.query('DELETE FROM ohrm_leave_request WHERE id = ?', [leaveRequestId]);
  }
}
