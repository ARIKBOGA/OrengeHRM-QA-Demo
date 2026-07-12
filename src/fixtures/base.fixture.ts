/**
 * BASE FIXTURE — single import point for all tests.
 * Every test file imports `test` and `expect` from here.
 * Never import directly from @playwright/test in test files.
 *
 * Usage:
 *   import { test, expect } from '@fixtures/base.fixture';
 */
// src/fixtures/base.fixture.ts
import { APIRequestContext, mergeTests, request } from '@playwright/test';
import { apiFixture } from './api.fixture';
import { authFixture } from './auth.fixture';
import { dbFixture } from './db.fixture';
import { test as pomTest } from './pom.fixture';

type AuthenticatedApiFixture = {
  authenticatedApi: APIRequestContext;
};

const mergedTest = mergeTests(authFixture, apiFixture, dbFixture, pomTest);

export const test = mergedTest.extend<AuthenticatedApiFixture>({
  authenticatedApi: async ({ authContext }, use) => {
    const storageState = await authContext.storageState();
    const cookie = storageState.cookies.find((c) => c.name === '_orangehrm');
    const ctx = await request.newContext({
      baseURL: 'http://localhost:8080',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: `_orangehrm=${cookie?.value ?? ''}`,
      },
    });

    await use(ctx);
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
