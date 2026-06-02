import { test, expect } from '@fixtures/base.fixture';
import { LoginPage }    from '@pages/login.page';
import { config }       from '@config/env';

/**
 * SMOKE TEST
 * Fast, minimal check that the app is up and login works.
 * Runs in both local and staging environments.
 * Should complete in < 30 seconds.
 */
test.describe('Smoke', () => {

  test('app is reachable and login works', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(config.admin.username, config.admin.password);
    await loginPage.expectDashboardVisible();
  });

});
