import { BaseModel } from '@core/data';
import { Client } from 'pg';

export class PeruseJobEntity extends BaseModel<PeruseJobEntity> {
  static Columns: Record<keyof PeruseJobEntity, string> = {
    jobId: 'job_id',
    invoiceId: 'invoice_id',
    perusePayload: 'peruse_payload',
    bobtailPayload: 'bobtail_payload',
  };

  jobId: string;
  invoiceId: string;
  perusePayload: Record<string, any>;
  bobtailPayload: Record<string, any>;
}

export class PeruseRepository {
  private readonly database: Client;

  private constructor() {
    this.database = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'sandbox',
      password: '',
      port: 5432,
    });
  }

  async findAllJobs(): Promise<PeruseJobEntity[]> {
    const results = await this.database.query('SELECT * FROM jobs');
    const entries = Object.entries(PeruseJobEntity.Columns);
    return results.rows.map((row) => {
      const entity = new PeruseJobEntity();
      for (const entry of entries) {
        entity[entry[0]] = row[entry[1]];
      }
      return entity;
    });
  }

  async insert(entity: PeruseJobEntity) {
    const sqlColumns: string[] = [];
    const sqlValues: any[] = [];
    const sqlPlaceholders: string[] = [];
    for (const [key, value] of Object.entries(PeruseJobEntity.Columns)) {
      sqlValues.push(entity[key]);
      sqlColumns.push(value);
      sqlPlaceholders.push(`$${sqlPlaceholders.length + 1}`);
    }

    const sqlQuery = `INSERT INTO jobs(${sqlColumns.join(
      ',',
    )}) VALUES(${sqlPlaceholders.join(',')})`;
    await this.database.query(sqlQuery, sqlValues);
  }

  static async init() {
    const repository = new PeruseRepository();
    await repository.database.connect();
    return repository;
  }
}
