/**
 * AUTH FIXTURE
 * Provides a pre-authenticated page and browser context.
 * Login is performed ONCE per worker — storage state is reused across tests.
 * No new login round-trip per test.
 */
import { test as base, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { config }    from '@config/env';

// Worker-scoped ve test-scoped fixture'lar ayrı type'larda olmalı
type AuthWorkerFixtures = {
  authContext: BrowserContext;
};

type AuthTestFixtures = {
  authenticatedPage: Page;
};

export const authFixture = base.extend<AuthTestFixtures, AuthWorkerFixtures>({

  // İkinci generic parametreye (WorkerFixtures) gidiyor — scope: worker burada geçerli
  authContext: [async ({ browser }, use) => {
    const context   = await browser.newContext();
    const page      = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(config.admin.username, config.admin.password);
    await loginPage.expectDashboardVisible();

    await use(context);
    await context.close();
  }, { scope: 'worker' }],

  // İlk generic parametreye (TestFixtures) gidiyor — normal test scope
  authenticatedPage: async ({ authContext }, use) => {
    const page = await authContext.newPage();
    await use(page);
    await page.close();
  },
});