import { AxiosHeaderValue } from 'axios';
import { ClassConstructor } from 'class-transformer';

export interface ClientOptions {
  nullOnFail?: boolean;
}
export interface ResponseOptions<T> {
  bodyType?: ClassConstructor<T>;
  mapper?: (bodyData: any) => T;
  asyncMapper?: (bodyData: any) => Promise<T>;
  validateBody?: boolean;
}

interface RequestOptions {
  headers?: { [header: string]: AxiosHeaderValue };
  validate?: boolean;
  toPlainObject?: boolean;
}

interface PostRequestOptions extends RequestOptions {
  body: any;
}

interface GetRequestOptions extends RequestOptions {
  body?: any;
  queryParams?: URLSearchParams;
}

interface RequestResponseOptions<
  T,
  TRequest extends RequestOptions,
  Tresponse = ResponseOptions<T>,
> extends ClientOptions {
  response: Tresponse;
  request?: TRequest;
  timeout?: number;
}

export type PostOptions<T> = RequestResponseOptions<T, PostRequestOptions>;
export type GetOptions<T> = RequestResponseOptions<T, GetRequestOptions>;
export type DeleteOptions<T> = RequestResponseOptions<T, any>;
