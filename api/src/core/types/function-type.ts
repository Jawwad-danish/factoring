import { KeysMatching } from './keys-matching';

export type AnyFunction = (...args: any[]) => any;

export type TypeFunction<T> = (...args: any[]) => T;

export type FunctionsOnly<T> = KeysMatching<T, AnyFunction>;
