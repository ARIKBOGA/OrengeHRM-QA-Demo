import { test, expect } from '@fixtures/base.fixture';
import { createLeaveRequest } from '@data/factories/leave.factory';
import { LeaveTypeUtil, LeaveType } from '@utils/api/leave-type.util';
import { RequestUtil } from '@utils/api/request.util';
import { DbAssertionUtil } from '@utils/db/assertion.util';
import { SeedUtil } from '@utils/db/seed.util';
import { ApiResponse } from '@t/api.types';

let requestUtil: RequestUtil;
let dbAssertion: DbAssertionUtil;
let seedUtil: SeedUtil;
let leaveTypeUtil: LeaveTypeUtil;

test.describe('Leave Assign — Integration', () => {
  test.beforeEach(async ({ authenticatedApi, db }) => {
    requestUtil = new RequestUtil(authenticatedApi);
    dbAssertion = new DbAssertionUtil(db);
    seedUtil = new SeedUtil(db);
    leaveTypeUtil = new LeaveTypeUtil(requestUtil);
  });

  test(
    'LEAVE-A-001: Assign → verify → cancel → verify, leaving zero residue',
    async () => {
      let leaveType: LeaveType | undefined;
      let leaveRequestId: number | undefined;

      try {
        // 1. POST — create a dedicated leave type
        leaveType = await leaveTypeUtil.createLeaveType('AssignTest');

        // 2. POST — assign leave
        const payload = createLeaveRequest(leaveType.id, { empNumber: 1 });
        const createResponse = await requestUtil.post<ApiResponse<{ id: number }>>(
          '/api/v2/leave/employees/leave-requests',
          payload
        );
        leaveRequestId = createResponse.data.id;
        expect(leaveRequestId).toBeDefined();

        // 3. GET — verify correct leave type + initial status
        const initialLeaves = await requestUtil.get<ApiResponse<any[]>>(
          `/api/v2/leave/leave-requests/${leaveRequestId}/leaves`
        );
        expect(initialLeaves.data.every((l) => l.leaveType.id === leaveType!.id)).toBe(true);
        expect(initialLeaves.data.every((l) => l.leaveStatus.name === 'Scheduled')).toBe(true);

        const leaveId = initialLeaves.data[0].id;

        // 4. PUT — cancel it (real status-transition test)
        await requestUtil.put(`/api/v2/leave/leaves/${leaveId}`, { action: 'CANCEL' });

        // 5. GET — verify status actually changed
        const afterCancel = await requestUtil.get<ApiResponse<any[]>>(
          `/api/v2/leave/leave-requests/${leaveRequestId}/leaves`
        );
        expect(afterCancel.data.find((l) => l.id === leaveId)?.leaveStatus.name).toBe('Cancelled');

        // 6. DB assertion — confirm the transition persisted, not just the API response
        await dbAssertion.expectRowExists('ohrm_leave', { id: leaveId });
      } finally {
        // 7. DELETE — full cleanup, zero residue
        if (leaveRequestId) {
          await seedUtil.cleanupLeaveRequest(leaveRequestId);
        }
        if (leaveType) {
          await leaveTypeUtil.deleteLeaveType(leaveType.id);
        }
      }

      // 8. GET — prove the leave type is really gone (zero-residue proof)
      if (leaveType) {
        const remaining = await requestUtil.get<ApiResponse<LeaveType[]>>('/api/v2/leave/leave-types');
        expect(remaining.data.some((t) => t.id === leaveType!.id)).toBe(false);
      }
    }
  );
});