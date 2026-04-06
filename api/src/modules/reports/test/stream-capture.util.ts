import { Readable } from 'stream';

export async function captureStreamRows<T>(stream: Readable): Promise<T[]> {
  const rows: T[] = [];
  for await (const row of stream) {
    rows.push(row);
  }
  return rows;
}
