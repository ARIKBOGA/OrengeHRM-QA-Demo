/**
 * API FIXTURE
 * Provides:
 *   - apiContext: unauthenticated Playwright APIRequestContext
 *   - authenticatedApi: context with OAuth2 Bearer token injected
 *
 * OrangeHRM uses OAuth2 client_credentials flow for API access.
 * Token is fetched once and reused within the fixture scope.
 */
import { test as base, APIRequestContext, request } from '@playwright/test';
import { config } from '@config/env';

type ApiFixtures = {
  apiContext: APIRequestContext;
};

export const apiFixture = base.extend<ApiFixtures>({

  apiContext: async ({}, use) => {
    const ctx = await request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

});