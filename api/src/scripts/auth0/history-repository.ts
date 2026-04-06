import { Client } from 'pg';

const TABLE = 'auth0_log_entries';
const COLUMNS = {
  id: 'id',
  email: 'email',
  entries: 'entries',
  createdAt: 'created_at',
};

export interface HistoryRow {
  id: string;
  email: string;
  entries: any;
  createdAt: Date;
}

export class HistoryRepository {
  private readonly database: Client;

  static async init() {
    const repository = new HistoryRepository();
    await repository.database.connect();
    return repository;
  }

  private constructor() {
    this.database = new Client({
      user: 'postgres',
      database: 'sandbox',
      password: '',
      port: 5432,
    });
  }

  async insert(email: string, entries: any): Promise<void> {
    await this.database.query(
      `INSERT INTO ${TABLE}(${COLUMNS.email}, ${COLUMNS.entries}, ${COLUMNS.createdAt}) VALUES($1, $2, NOW())`,
      [email, JSON.stringify(entries)],
    );
  }

  async exists(email: string): Promise<boolean> {
    const result = await this.database.query(
      `SELECT count(*) as "count" FROM ${TABLE} where ${COLUMNS.email} = $1`,
      [email],
    );
    return parseInt(result.rows[0]['count']) === 1;
  }

  async findAll(): Promise<HistoryRow[]> {
    const result = await this.database.query(`SELECT * FROM ${TABLE}`);
    return result.rows.map((row) => {
      return {
        id: row[COLUMNS.id],
        email: row[COLUMNS.email],
        createdAt: new Date(row[COLUMNS.createdAt]),
        entries: row[COLUMNS.entries],
      };
    });
  }
}
