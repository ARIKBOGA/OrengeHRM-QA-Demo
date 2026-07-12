import { test, expect } from '@fixtures/base.fixture';
import { createLeaveRequest } from '@data/factories/leave.factory';
import { LeaveTypeUtil, LeaveType } from '@utils/api/leave-type.util';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { ApiResponse } from '@t/api.types';

let requestUtil: RequestUtil;
let dbAssertion: DbAssertionUtil;
let leaveTypeUtil: LeaveTypeUtil;

test.describe('Leave Assign — Integration', () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    dbAssertion = new DbAssertionUtil(db);
    leaveTypeUtil = new LeaveTypeUtil(requestUtil);
  });

  test('LEAVE-A-001: Assign Leave uses the exact leave type provided, not a default', async () => {
    const leaveType: LeaveType = await leaveTypeUtil.createLeaveType('AssignTest');

    try {
      const payload = createLeaveRequest(leaveType.id, { empNumber: 1 });

      const response = await requestUtil.post<ApiResponse<{ id: number }>>('/api/v2/leave/employees/leave-requests', payload);

      expect(response.data.id).toBeDefined();

      const leaves = await requestUtil.get<ApiResponse<any[]>>(`/api/v2/leave/leave-requests/${response.data.id}/leaves`);
      expect(leaves.data.every((leave) => leave.leaveType.id === leaveType.id)).toBe(true);
      expect(leaves.data.every((leave) => leave.leaveType.name === leaveType.name)).toBe(true);

      await dbAssertion.expectRowExists('ohrm_leave', {
        leave_type_id: leaveType.id,
        emp_number: 1,
      });
    } finally {
      await leaveTypeUtil.deleteLeaveType(leaveType.id);
    }
  });
});
