import { expect }   from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  readonly path = '/web/index.php/dashboard/index';

  private get header() {
    return this.locator('.oxd-topbar-header-breadcrumb h6');
  }

  private get quickLaunchWidget() {
    return this.locator('.dash-quicklaunch-widget');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.header).toBeVisible();
  }
}