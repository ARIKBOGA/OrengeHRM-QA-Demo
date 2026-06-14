import { expect }   from '@playwright/test';
import { BasePage } from '../base.page';

export interface NewEmployeeData {
  firstName:   string;
  middleName?: string;   // middle_name → middleName
  lastName:    string;
  employeeId?: string;
}

export class AddEmployeePage extends BasePage {
  readonly path = '/web/index.php/pim/addEmployee';

  private get firstNameInput()  { return this.locator('[name="firstName"]'); }
  private get middleNameInput() { return this.locator('[name="middleName"]'); }  // düzeltildi
  private get lastNameInput()   { return this.locator('[name="lastName"]'); }
  private get employeeIdInput() {
    return this.page
      .locator('.oxd-input-group')
      .filter({ has: this.page.locator('.oxd-label', { hasText: 'Employee Id' }) })
      .locator('input');
  }
  private get saveButton()      { return this.getByRole('button', { name: 'Save' }); }
  private get successToast()    { return this.locator('.oxd-toast--success'); }

  async fillEmployeeForm(data: NewEmployeeData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    if (data.middleName) await this.middleNameInput.fill(data.middleName);
    await this.lastNameInput.fill(data.lastName);
    if (data.employeeId) {
      await this.employeeIdInput.clear();
      await this.employeeIdInput.fill(data.employeeId);
    }
  }

  async save(): Promise<void> {
    await this.interceptResponse(
      /\/web\/index\.php\/api\/v2\/pim\/employees/,  // full path — düzeltildi
      () => this.saveButton.click()
    );
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.successToast).toBeVisible();
  }
}