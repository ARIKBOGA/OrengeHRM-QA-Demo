import { RequestUtil } from './request.util';
import { ApiResponse } from '@t/api.types';

export interface LeaveType {
  id: number;
  name: string;
  deleted: boolean;
  situational?: boolean;
}

export class LeaveTypeUtil {
  constructor(private readonly requestUtil: RequestUtil) {}

  /**
   * Creates a leave type with a unique name and returns its real ID.
   * Never assume a fixed ID (e.g. "1 = Annual Leave") — that's only an
   * accident of seed order, not a guarantee.
   */
  async createLeaveType(namePrefix = 'LeaveType'): Promise<LeaveType> {
    const uniqueName = `${namePrefix}-${Date.now()}`;
    const response = await this.requestUtil.post<ApiResponse<LeaveType>>('/api/v2/leave/leave-types', {
      name: uniqueName,
      situational: false,
    });
    return response.data;
  }

  async deleteLeaveType(id: number): Promise<void> {
    await this.requestUtil.delete('/api/v2/leave/leave-types', { ids: [id] });
  }
}
