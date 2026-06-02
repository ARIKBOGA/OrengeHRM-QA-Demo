/**
 * DB FIXTURE
 * Provides a mysql2 connection for the duration of each test.
 * Automatically skips (no-ops) when DB_ENABLED=false (staging env).
 * Connection is closed automatically after each test.
 */
import { test as base } from '@playwright/test';
import { DbQueryUtil }  from '@utils/db/query.util';
import { config }       from '@config/env';

type DbFixtures = {
  db: DbQueryUtil;
};

export const dbFixture = base.extend<DbFixtures>({

  db: async ({}, use) => {
    const db = new DbQueryUtil();

    if (config.dbEnabled) {
      await db.connect();
    } else {
      console.info('[DB Fixture] DB_ENABLED=false — skipping DB connection (staging mode)');
    }

    await use(db);

    if (config.dbEnabled) {
      await db.disconnect();
    }
  },
});
