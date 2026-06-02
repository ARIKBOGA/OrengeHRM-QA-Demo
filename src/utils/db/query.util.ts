import mysql, { Connection, RowDataPacket } from 'mysql2/promise';
import { config } from '@config/env';

/**
 * DB Query Utility — mysql2 connection wrapper for OrangeHRM's MySQL database.
 *
 * Only active when DB_ENABLED=true (local/QA environment).
 * In staging environment, all methods are no-ops and return empty results.
 *
 * Connection string: mysql://[user]:[password]@[host]:[port]/[dbname]
 */
export class DbQueryUtil {
  private connection: Connection | null = null;

  async connect(): Promise<void> {
    if (!config.dbEnabled) return;

    this.connection = await mysql.createConnection({
      host:     config.db.host,
      port:     config.db.port,
      database: config.db.name,
      user:     config.db.user,
      password: config.db.password,
    });

    console.info(`[DB] Connected to MySQL at ${config.db.host}:${config.db.port}/${config.db.name}`);
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.info('[DB] Disconnected from MySQL');
    }
  }

  async query<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.connection) {
      console.warn('[DB] query() called but no connection — DB_ENABLED=false or connect() not called');
      return [];
    }
    const [rows] = await this.connection.execute<T[]>(sql, params);
    return rows;
  }

  async queryOne<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
