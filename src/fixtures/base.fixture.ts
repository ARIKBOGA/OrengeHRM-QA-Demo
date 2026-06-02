/**
 * BASE FIXTURE — single import point for all tests.
 * Every test file imports `test` and `expect` from here.
 * Never import directly from @playwright/test in test files.
 *
 * Usage:
 *   import { test, expect } from '@fixtures/base.fixture';
 */
import { mergeTests } from '@playwright/test';
import { authFixture } from './auth.fixture';
import { apiFixture }  from './api.fixture';
import { dbFixture }   from './db.fixture';

export const test   = mergeTests(authFixture, apiFixture, dbFixture);
export { expect }   from '@playwright/test';
