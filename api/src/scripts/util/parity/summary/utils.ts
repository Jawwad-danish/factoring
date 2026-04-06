import { Client } from 'pg';
import * as fs from 'fs';
import * as csv from 'fast-csv';

export interface DbConfig {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
  connectionTimeoutMillis: number;
}

export async function connectToDb(config: DbConfig): Promise<Client | null> {
  try {
    const client = new Client(config);
    await client.connect();
    return client;
  } catch (error) {
    console.error(`Error connecting to database: ${error}`);
    return null;
  }
}

export async function connectToV1Database(config: DbConfig): Promise<Client> {
  console.log('Connecting to V1 database...');
  const client = await connectToDb(config);
  if (!client) {
    throw new Error('Failed to connect to V1 database');
  }
  console.log('Connected to V1 database.');
  return client;
}

export async function writeToCsv(filePath: string, data: any[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath);
    csv
      .write(data, { headers: true })
      .pipe(ws)
      .on('finish', () => resolve())
      .on('error', (error) => reject(error));
  });
}
