export interface LeaveRequestData {
  empNumber?: number;
  leaveTypeId: number;
  fromDate: string;
  toDate: string;
  comment?: string;
  duration: { type: 'full_day' | 'half_day_morning' | 'half_day_afternoon' | 'specify_time' };
}

/**
 * Builds a valid leave request payload.
 * leaveTypeId has NO default — callers must resolve a real ID via
 * LeaveTypeUtil.createLeaveType() first. Hardcoding "1" assumes seed
 * order that isn't guaranteed once more types exist.
 *
 * Default range is a single working day (Wednesday) — single-day and
 * multi-day requests both work correctly once the workweek is properly
 * provisioned (see known-behaviors.md).
 */
export function createLeaveRequest(
  leaveTypeId: number,
  overrides: Partial<Omit<LeaveRequestData, 'leaveTypeId'>> = {}
): LeaveRequestData {
  return {
    leaveTypeId,
    fromDate: '2026-08-12', // Wednesday
    toDate: '2026-08-12',
    duration: { type: 'full_day' },
    ...overrides,
  };
}