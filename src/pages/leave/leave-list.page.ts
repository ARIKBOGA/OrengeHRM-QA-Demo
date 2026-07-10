import { expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class LeaveListPage extends BasePage {
  readonly path = '/web/index.php/leave/viewLeaveList';

  private get tableRows() {
    return this.locator('.oxd-table-body .oxd-table-row');
  }

  private get noRecordsMessage() {
    return this.locator('.oxd-text').filter({ hasText: 'No Records Found' });
  }

  async expectLeaveVisible(employeeName: string): Promise<void> {
    await expect(this.locator('.oxd-table-cell').filter({ hasText: employeeName })).toBeVisible();
  }

  async expectNoRecords(): Promise<void> {
    await expect(this.noRecordsMessage).toBeVisible();
  }

  async expectRecordCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }
}
