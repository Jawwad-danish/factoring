import { Config } from './config';
import { ParseError } from './errors';

const KEY = 'key';

describe('Config', () => {
  test('Config with key will return the correct key', () => {
    const config = new Config(KEY, '');
    expect(config.getKey()).toBe(KEY);
  });

  test('Config with value checked for value will return true', () => {
    const config = new Config(KEY, '');
    expect(config.hasValue()).toBe(true);
  });

  test('Config with null value checked for value will return false', () => {
    const config = new Config(KEY, null);
    expect(config.hasValue()).toBe(false);
  });

  test('Config with undefined checked for value will return false', () => {
    const config = new Config(KEY, undefined);
    expect(config.hasValue()).toBe(false);
  });

  test('Config with string value will return the string when getting as string', () => {
    const value = 'value';
    const config = new Config(KEY, value);
    expect(config.asString()).toBe(value);
  });

  test('Config with null value will return null string when getting as string', () => {
    const config = new Config(KEY, null);
    expect(config.asString()).toBe('null');
  });

  test('Config with number value will return number string when getting as string', () => {
    const config = new Config(KEY, 10);
    expect(config.asString()).toBe('10');
  });

  test('Config with boolean value will return boolean string when getting as string', () => {
    const config = new Config(KEY, true);
    expect(config.asString()).toBe('true');
  });

  test('Config with number value will return the number when getting as number', () => {
    const config = new Config(KEY, 10);
    expect(config.asNumber()).toBe(10);
  });

  test('Config with string number value will return the number when getting as number', () => {
    const config = new Config(KEY, '10');
    expect(config.asNumber()).toBe(10);
  });

  test('Config with string value will throw error when getting as number', () => {
    const config = new Config(KEY, 'number');
    expect(() => config.asNumber()).toThrow(ParseError);
  });

  test('Config with null value will throw error when getting as number', () => {
    const config = new Config(KEY, 'number');
    expect(() => config.asNumber()).toThrow(ParseError);
  });

  test('Config with null value will return null when getting as raw', () => {
    const config = new Config(KEY, null);
    expect(config.asRaw()).toBe(null);
  });

  test('Config with number value will return number when getting as raw', () => {
    const config = new Config(KEY, 10);
    expect(config.asRaw()).toBe(10);
  });

  test('Config with string value will return string when getting as raw', () => {
    const config = new Config(KEY, 'null');
    expect(config.asRaw()).toBe('null');
  });

  test('Config with stringified JSON will return the object', () => {
    const toCheck = { text: 'string', number: 10, null: null };
    const config = new Config(KEY, JSON.stringify(toCheck));
    const parsed = config.asParsedJson();
    expect(parsed).toStrictEqual(toCheck);
  });
});
