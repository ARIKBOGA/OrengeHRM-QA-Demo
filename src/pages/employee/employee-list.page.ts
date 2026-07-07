import { expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class EmployeeListPage extends BasePage {
  readonly path = '/web/index.php/pim/viewEmployeeList';

  public get searchButton() {
    return this.getByRole('button', { name: 'Search' });
  }

  public get employeeNameInput() {
    return this.getByRole('textbox', { name: 'Type for hints...' }).first();
  }

  private get recordsFound() {
    return this.locator('.oxd-text--span').filter({ hasText: 'Record' });
  }
  async getRecordCount(): Promise<number> {
    return this.tableRows.count();
  }

  private get tableRows() {
    return this.locator('.oxd-table-body .oxd-table-row');
  }

  async searchByName(name: string): Promise<void> {
    await this.employeeNameInput.click();
    await this.employeeNameInput.clear();
    await this.employeeNameInput.pressSequentially(name, { delay: 50 });
    await this.searchButton.click();
    await this.waitForPageReady();
  }

  async expectEmployeeVisible(name: string): Promise<void> {
    await expect(this.locator('.oxd-table-body .oxd-table-row').filter({ hasText: name }).first()).toBeVisible();
  }

  async expectNoRecordsFound(): Promise<void> {
    await expect(this.locator('span.oxd-text--span').filter({ hasText: 'No Records Found' })).toBeVisible();
  }

  async expectRecordCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }
}
