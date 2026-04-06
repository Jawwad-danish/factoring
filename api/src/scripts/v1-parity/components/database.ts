import { Client } from 'pg';

export interface DatabaseConnectionDetails {
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
  connectionTimeoutMillis: number;
  ssl?: {
    rejectUnauthorized: boolean;
  };
}

async function buildDatabaseConnection(
  details: DatabaseConnectionDetails,
): Promise<Client> {
  try {
    const client = new Client(details);
    await client.connect();
    return client;
  } catch (error) {
    console.error(`Could not obtain database connection`, error);
    throw error;
  }
}

export async function connectToV1Database(): Promise<Client> {
  return await buildDatabaseConnection({
    host: 'localhost',
    database: 'bobtail',
    user: '',
    password: '',
    port: 9990,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}
