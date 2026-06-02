import { expect }   from '@playwright/test';
import { BasePage } from '../base.page';

export class EmployeeListPage extends BasePage {
  readonly path = '/web/index.php/pim/viewEmployeeList';

  private get searchButton() {
    return this.getByRole('button', { name: 'Search' });
  }

  private get employeeNameInput() {
    return this.locator('.oxd-input').first();
  }

  private get recordsFound() {
    return this.locator('.oxd-text--span').filter({ hasText: 'Record' });
  }

  private get tableRows() {
    return this.locator('.oxd-table-body .oxd-table-row');
  }

  async searchByName(name: string): Promise<void> {
    await this.employeeNameInput.fill(name);
    await this.searchButton.click();
    await this.waitForPageReady();
  }

  async expectEmployeeVisible(name: string): Promise<void> {
    await expect(this.locator('.oxd-table-cell').filter({ hasText: name })).toBeVisible();
  }

  async getRecordCount(): Promise<number> {
    const text = await this.recordsFound.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }
}// TODO
