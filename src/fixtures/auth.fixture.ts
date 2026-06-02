/**
 * AUTH FIXTURE
 * Provides a pre-authenticated page and browser context.
 * Login is performed ONCE per worker — storage state is reused across tests.
 * No new login round-trip per test.
 */
import { test as base, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { config }    from '@config/env';

type AuthFixtures = {
  authContext:       BrowserContext;
  authenticatedPage: Page;
};

export const authFixture = base.extend<AuthFixtures>({

  authContext: [async ({ browser }, use) => {
    const context   = await browser.newContext();
    const page      = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(config.admin.username, config.admin.password);
    await loginPage.expectDashboardVisible();

    await use(context);
    await context.close();
  }, { scope: 'worker' }],  // worker scope = one login per parallel worker, not per test

  authenticatedPage: async ({ authContext }, use) => {
    const page = await authContext.newPage();
    await use(page);
    await page.close();
  },
});
