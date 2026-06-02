import { expect }      from '@playwright/test';
import { DbQueryUtil } from './query.util';
import { RowDataPacket } from 'mysql2';
import { config }      from '@config/env';

/**
 * DB Assertion Utility — high-level assertion helpers.
 * Automatically skips assertions in staging (DB_ENABLED=false).
 */
export class DbAssertionUtil {
  constructor(private readonly db: DbQueryUtil) {}

  async expectRowExists(table: string, where: Record<string, unknown>): Promise<void> {
    if (!config.dbEnabled) {
      console.info(`[DB Assert] Skipping expectRowExists — staging mode`);
      return;
    }
    const conditions = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
    const values     = Object.values(where);
    const sql        = `SELECT COUNT(*) as cnt FROM ${table} WHERE ${conditions}`;
    const row        = await this.db.queryOne<RowDataPacket & { cnt: number }>(sql, values);
    expect(row?.cnt, `Expected a row in ${table} matching ${JSON.stringify(where)}`).toBeGreaterThan(0);
  }

  async expectRowCount(table: string, expectedCount: number, where?: Record<string, unknown>): Promise<void> {
    if (!config.dbEnabled) {
      console.info(`[DB Assert] Skipping expectRowCount — staging mode`);
      return;
    }
    const whereClause = where
      ? 'WHERE ' + Object.keys(where).map(k => `${k} = ?`).join(' AND ')
      : '';
    const values = where ? Object.values(where) : [];
    const sql    = `SELECT COUNT(*) as cnt FROM ${table} ${whereClause}`;
    const row    = await this.db.queryOne<RowDataPacket & { cnt: number }>(sql, values);
    expect(row?.cnt).toBe(expectedCount);
  }

  async expectFieldValue(
    table: string,
    where: Record<string, unknown>,
    field: string,
    expectedValue: unknown
  ): Promise<void> {
    if (!config.dbEnabled) {
      console.info(`[DB Assert] Skipping expectFieldValue — staging mode`);
      return;
    }
    const conditions = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
    const values     = Object.values(where);
    const sql        = `SELECT ${field} FROM ${table} WHERE ${conditions} LIMIT 1`;
    const row        = await this.db.queryOne<RowDataPacket>(sql, values);
    expect(row?.[field]).toBe(expectedValue);
  }
}
