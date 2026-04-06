import { randomInt } from 'crypto';
import * as names from '../resources/random-names.json';
import * as surnames from '../resources/random-surnames.json';

export const randomName = (): string => {
  const index = randomInt(names.data.length);
  return names.data[index];
};

export const randomSurname = (): string => {
  const index = randomInt(surnames.data.length);
  return surnames.data[index];
};
