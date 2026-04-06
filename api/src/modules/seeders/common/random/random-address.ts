import { randomInt } from 'crypto';
import * as zipCodes from '../resources/random-zip-codes.json';

export interface Address {
  zipCode: string;
  city: string;
  state: string;
}

export const randomAddress = (): Address => {
  const index = randomInt(zipCodes.data.length);
  const zipCode = zipCodes.data[index];
  const split = zipCode.detail.split(',');
  return {
    zipCode: zipCode.name,
    city: split[0],
    state: split[1].trim(),
  };
};
