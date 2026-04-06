import { IQueryHandler } from '@nestjs/cqrs';
import { Query } from './query';

type QueryReturnType<T> = T extends Query<infer R> ? R : never;

export type BasicQueryHandler<T extends Query<any>> = IQueryHandler<
  T,
  QueryReturnType<T>
>;
