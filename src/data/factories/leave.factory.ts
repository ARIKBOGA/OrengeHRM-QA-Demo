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
 * IMPORTANT: fromDate/toDate default to a 2-day range — single-day
 * requests always fail on this OrangeHRM version (see known-behaviors.md).
 * Defaults land on a Mon–Tue pair to stay clear of the weekend.
 */
export function createLeaveRequest(
  leaveTypeId: number,
  overrides: Partial<Omit<LeaveRequestData, 'leaveTypeId'>> = {}
): LeaveRequestData {
  return {
    leaveTypeId,
    fromDate: '2026-08-10', // Monday
    toDate: '2026-08-11',   // Tuesday
    duration: { type: 'full_day' },
    ...overrides,
  };
}