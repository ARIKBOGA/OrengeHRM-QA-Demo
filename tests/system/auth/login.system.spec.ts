import { test, expect }    from '@fixtures/base.fixture';
import { LoginPage }       from '@pages/login.page';
import { InterceptorUtil } from '@utils/api/interceptor.util';
import { config }          from '@config/env';

/**
 * SYSTEM TEST — Authentication
 * Layer:  System (UI + API together)
 * Scope:  UI action triggers API call — both are asserted.
 */
test.describe('Login — System', () => {

  test('valid login shows dashboard and triggers 200 API response', async ({ page }) => {
    const loginPage   = new LoginPage(page);
    const interceptor = new InterceptorUtil(page);

    interceptor.startCapturing(/\/auth\/validate/);

    await loginPage.navigate();
    await loginPage.login(config.admin.username, config.admin.password);

    // ── Assert: UI ────────────────────────────────────────────────────────
    await loginPage.expectDashboardVisible();

    // ── Assert: background API call ───────────────────────────────────────
    const lastResp = interceptor.getLastResponse();
    expect(lastResp).not.toBeNull();
    expect(lastResp?.status()).toBe(200);
  });

  test('invalid credentials show error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('wrong_user', 'wrong_pass');
    await loginPage.expectLoginError();
  });

});
