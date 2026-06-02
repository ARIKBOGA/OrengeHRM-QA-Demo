import { expect }   from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly path = '/web/index.php/auth/login';

  private get usernameInput() { return this.getByPlaceholder('Username'); }
  private get passwordInput() { return this.getByPlaceholder('Password'); }
  private get loginButton()   { return this.getByRole('button', { name: 'Login' }); }
  private get errorMessage()  { return this.locator('.oxd-alert-content'); }
  private get dashboardTitle(){ return this.locator('.oxd-topbar-header-breadcrumb h6'); }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectDashboardVisible(): Promise<void> {
    await expect(this.dashboardTitle).toBeVisible();
  }

  async expectLoginError(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
  }
}
