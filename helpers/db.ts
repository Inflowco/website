import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'compressedair.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sqliteDb: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

export async function initDb(): Promise<SqlJsDatabase> {
  if (sqliteDb) return sqliteDb;

  if (!initPromise) {
    initPromise = (async () => {
      const SQL = await initSqlJs();

      let buffer: Buffer | null = null;
      try {
        if (fs.existsSync(dbPath)) {
          buffer = fs.readFileSync(dbPath);
        }
      } catch (err) {
        // File doesn't exist
      }

      sqliteDb = buffer ? new SQL.Database(buffer) : new SQL.Database();
      return sqliteDb;
    })();
  }

  return initPromise;
}

export function saveDb() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

export function getDb(): SqlJsDatabase {
  if (!sqliteDb) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return sqliteDb;
}

// Helper to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert row keys from snake_case to camelCase
function convertRowKeys(row: Record<string, any>): Record<string, any> {
  const converted: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    converted[snakeToCamel(key)] = value;
  }
  return converted;
}

// Simple query builder for common operations
// These are synchronous but require initDb() to have been called before use
export const db = {
  selectFrom(table: string) {
    return new QueryBuilder(table, 'select');
  },

  insertInto(table: string) {
    return new InsertBuilder(table);
  },

  updateTable(table: string) {
    return new UpdateBuilder(table);
  },

  deleteFrom(table: string) {
    return new DeleteBuilder(table);
  },
};

class QueryBuilder {
  private table: string;
  private selectColumns: string[] = ['*'];
  private joins: string[] = [];
  private whereConditions: string[] = [];
  private whereParams: any[] = [];
  private orderByClause: string = '';
  private limitValue: number | null = null;
  private offsetValue: number | null = null;

  constructor(table: string, _type: string) {
    this.table = table;
  }

  select(columns: string | string[]) {
    this.selectColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  innerJoin(table: string, col1: string, col2: string) {
    this.joins.push(`INNER JOIN ${this.toSnakeCase(table)} ON ${this.toSnakeCase(col1)} = ${this.toSnakeCase(col2)}`);
    return this;
  }

  leftJoin(table: string, col1: string, col2: string) {
    this.joins.push(`LEFT JOIN ${this.toSnakeCase(table)} ON ${this.toSnakeCase(col1)} = ${this.toSnakeCase(col2)}`);
    return this;
  }

  where(column: string, op: string, value: any) {
    this.whereConditions.push(`${this.toSnakeCase(column)} ${op} ?`);
    this.whereParams.push(value);
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderByClause = `ORDER BY ${this.toSnakeCase(column)} ${direction.toUpperCase()}`;
    return this;
  }

  limit(n: number) {
    this.limitValue = n;
    return this;
  }

  offset(n: number) {
    this.offsetValue = n;
    return this;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  private buildSql(): string {
    const cols = this.selectColumns.map(c => {
      if (c === '*') return '*';
      if (c.includes(' as ')) {
        const [col, alias] = c.split(' as ').map(s => s.trim());
        return `${this.toSnakeCase(col)} as ${alias}`;
      }
      return this.toSnakeCase(c);
    }).join(', ');

    let sql = `SELECT ${cols} FROM ${this.toSnakeCase(this.table)}`;

    if (this.joins.length > 0) {
      sql += ' ' + this.joins.join(' ');
    }

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`;
    }

    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  async execute(): Promise<any[]> {
    const sql = this.buildSql();
    const db = getDb();

    try {
      const stmt = db.prepare(sql);
      if (this.whereParams.length > 0) {
        stmt.bind(this.whereParams);
      }

      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(convertRowKeys(stmt.getAsObject()));
      }
      stmt.free();

      return rows;
    } catch (err) {
      console.error('SQL Error:', sql, this.whereParams, err);
      throw err;
    }
  }

  async executeTakeFirst(): Promise<any | undefined> {
    this.limitValue = 1;
    const rows = await this.execute();
    return rows[0];
  }

  async executeTakeFirstOrThrow(): Promise<any> {
    const result = await this.executeTakeFirst();
    if (!result) {
      throw new Error('No result found');
    }
    return result;
  }
}

class InsertBuilder {
  private table: string;
  private data: Record<string, any> = {};
  private returningColumns: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  values(data: Record<string, any>) {
    this.data = data;
    return this;
  }

  returning(columns: string[]) {
    this.returningColumns = columns;
    return this;
  }

  async execute(): Promise<void> {
    const db = getDb();
    const columns = Object.keys(this.data).map(k => this.toSnakeCase(k));
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(this.data);

    const sql = `INSERT INTO ${this.toSnakeCase(this.table)} (${columns.join(', ')}) VALUES (${placeholders})`;

    try {
      db.run(sql, values);
      saveDb();
    } catch (err) {
      console.error('SQL Error:', sql, values, err);
      throw err;
    }
  }

  async executeTakeFirstOrThrow(): Promise<any> {
    const db = getDb();
    const columns = Object.keys(this.data).map(k => this.toSnakeCase(k));
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(this.data);

    const sql = `INSERT INTO ${this.toSnakeCase(this.table)} (${columns.join(', ')}) VALUES (${placeholders})`;

    try {
      db.run(sql, values);
      saveDb();

      // Get the last inserted row
      const lastId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];

      if (this.returningColumns.length > 0) {
        const selectCols = this.returningColumns.map(c => this.toSnakeCase(c)).join(', ');
        const selectSql = `SELECT ${selectCols} FROM ${this.toSnakeCase(this.table)} WHERE id = ?`;
        const stmt = db.prepare(selectSql);
        stmt.bind([lastId]);

        if (stmt.step()) {
          const row = convertRowKeys(stmt.getAsObject());
          stmt.free();
          return row;
        }
        stmt.free();
      }

      return { id: lastId };
    } catch (err) {
      console.error('SQL Error:', sql, values, err);
      throw err;
    }
  }
}

class UpdateBuilder {
  private table: string;
  private setData: Record<string, any> = {};
  private whereConditions: string[] = [];
  private whereParams: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  set(data: Record<string, any>) {
    this.setData = data;
    return this;
  }

  where(column: string, op: string, value: any) {
    this.whereConditions.push(`${this.toSnakeCase(column)} ${op} ?`);
    this.whereParams.push(value);
    return this;
  }

  async execute(): Promise<void> {
    const db = getDb();
    const setClauses = Object.keys(this.setData)
      .map(k => `${this.toSnakeCase(k)} = ?`)
      .join(', ');
    const values = [...Object.values(this.setData), ...this.whereParams];

    let sql = `UPDATE ${this.toSnakeCase(this.table)} SET ${setClauses}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    try {
      db.run(sql, values);
      saveDb();
    } catch (err) {
      console.error('SQL Error:', sql, values, err);
      throw err;
    }
  }
}

class DeleteBuilder {
  private table: string;
  private whereConditions: string[] = [];
  private whereParams: any[] = [];

  constructor(table: string) {
    this.table = table;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }

  where(column: string, op: string, value: any) {
    this.whereConditions.push(`${this.toSnakeCase(column)} ${op} ?`);
    this.whereParams.push(value);
    return this;
  }

  async execute(): Promise<void> {
    const db = getDb();
    let sql = `DELETE FROM ${this.toSnakeCase(this.table)}`;

    if (this.whereConditions.length > 0) {
      sql += ` WHERE ${this.whereConditions.join(' AND ')}`;
    }

    try {
      db.run(sql, this.whereParams);
      saveDb();
    } catch (err) {
      console.error('SQL Error:', sql, this.whereParams, err);
      throw err;
    }
  }
}

export { sqliteDb };
