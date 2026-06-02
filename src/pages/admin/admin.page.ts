import { expect }   from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminPage extends BasePage {
  readonly path = '/web/index.php/admin/viewAdminModule';

  private get pageHeader() {
    return this.locator('.oxd-topbar-header-breadcrumb h6');
  }

  private get userManagementMenu() {
    return this.getByRole('menuitem', { name: 'User Management' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.pageHeader).toBeVisible();
  }

  async navigateToUserManagement(): Promise<void> {
    await this.userManagementMenu.click();
    await this.waitForPageReady();
  }
}