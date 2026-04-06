import Big from 'big.js';
import { randomBytes, randomInt } from 'crypto';
import { UUID } from '@core/uuid';

export const randomString = (length: number): string => {
  return randomBytes(length).toString('hex');
};

export const randomEmail = (): string => {
  return `${UUID.get()}@bobtailtest.com`;
};

export const randomDate = (start: Date, end: Date): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

export const randomBoolean = (): boolean => {
  return Math.random() < 0.5;
};

export const randomBigInt = (max: number): Big => {
  return new Big(randomInt(max));
};

export function getRandomElement<T>(list: T[]): T {
  if (list.length === 0) {
    throw new Error('The list is empty.');
  }
  const randomIndex = randomInt(list.length);
  return list[randomIndex];
}
