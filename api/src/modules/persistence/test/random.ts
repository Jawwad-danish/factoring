import { randomBytes } from 'crypto';
import { UUID } from '@core/uuid';

export const randomString = (length: number): string => {
  return randomBytes(length).toString('hex');
};

export const randomEmail = (): string => {
  return `${UUID.get()}@bobtailtest.com`;
};
