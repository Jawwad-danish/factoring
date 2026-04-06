import { randomInt } from 'crypto';
import { LoremIpsum } from 'lorem-ipsum';
import { randomString } from './random';

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

export const randomMC = (): string => {
  const value = randomInt(9999999);
  return `${value}`;
};

export const randomDOT = (): string => {
  const value = randomInt(9999999);
  return `${value}`;
};

export const randomLoadNumber = (): string => {
  return randomString(10);
};

export const randomDisplayId = (): string => {
  return randomString(5);
};

export const randomNote = (): string => {
  return lorem.generateSentences(1);
};

export const randomMemo = (): string => {
  return lorem.generateSentences(1);
};

export const randomEnumValue = (enumeration) => {
  const values = Object.keys(enumeration);
  const enumKey = values[Math.floor(Math.random() * values.length)];
  return enumeration[enumKey];
};
