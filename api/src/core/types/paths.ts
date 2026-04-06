import { Collection } from '@mikro-orm/core';

type Level = 1 | 2 | 3 | 4;
type NextLevel = [1, 2, 3, 4, 'STOP'];
type Next<T> = T extends Level ? NextLevel[T] : 'STOP';

export type Paths<T, TDepth = 1> = TDepth extends 'STOP'
  ? never
  : T extends Collection<infer R>
  ? Paths<R, Next<TDepth>>
  : T extends object
  ? {
      [TKey in keyof T]: TKey extends string
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          T[TKey] extends Function
          ? never
          : TKey | `${TKey}.${Paths<T[TKey], Next<TDepth>>}`
        : never;
    }[keyof T]
  : never;
