import { AppContextHolder } from '@core/app-context';
import { ErrorFactory } from '@core/errors';
import { Observability } from '@core/observability';
import { AuthTokenService } from '@module-auth';
import { BadRequestException, HttpException, Logger } from '@nestjs/common';
import axios, {
  AxiosError,
  AxiosHeaderValue,
  AxiosHeaders,
  AxiosRequestConfig,
} from 'axios';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ValidationError, validateOrReject } from 'class-validator';
import { isObject } from 'lodash';
import {
  ClientOptions,
  DeleteOptions,
  GetOptions,
  PostOptions,
  ResponseOptions,
} from './http-client-options';

export class HttpClient {
  private logger: Logger = new Logger(HttpClient.name);

  constructor(
    public name: string,
    private readonly authTokenService: AuthTokenService,
  ) {}

  delete<T>(url: string, options?: DeleteOptions<T>): Promise<null | number> {
    this.logger.log(`DELETE ${url}`);

    return this.runHandled(async () => {
      const axiosConfig: AxiosRequestConfig = await this.buildAxiosConfig(
        options,
      );
      return await axios.delete(url, axiosConfig);
    }, options);
  }

  get<T>(url: string, options: GetOptions<T>): Promise<null | T | T[]> {
    return this.runHandled(async () => {
      const params = options.request?.queryParams;
      const queryString = params?.toString();
      this.logger.log(`GET ${url}${queryString ? `?${queryString}` : ''}`);

      const headers = await this.buildHeaders(options.request?.headers);
      const response = await axios.get(url, {
        headers,
        params: params || {},
        data: options.request?.body,
      });
      return this.getResponseBody(response.data, options.response);
    }, options);
  }

  post<T>(url: string, options: PostOptions<T>): Promise<T | null> {
    return this.runHandled(async () => {
      this.logger.log(`POST ${url}`);

      const axiosConfig: AxiosRequestConfig = await this.buildAxiosConfig(
        options,
      );
      let payload: any = options.request?.body || {};
      if (options.request?.validate) {
        await validateOrReject(payload);
      }
      if (options.request?.toPlainObject) {
        payload = instanceToPlain(payload);
      }
      const response = await axios.post(url, payload, axiosConfig);
      return await this.getResponseBody(response, options.response);
    }, options);
  }

  put<T>(url: string, options: PostOptions<T>): Promise<T | null> {
    return this.runHandled(async () => {
      this.logger.log(`PUT ${url}`);

      const axiosConfig: AxiosRequestConfig = await this.buildAxiosConfig(
        options,
      );
      let payload: any = options.request?.body || {};
      if (options.request?.validate) {
        await validateOrReject(payload);
      }
      if (options.request?.toPlainObject) {
        payload = instanceToPlain(payload);
      }
      const response = await axios.put(url, payload, axiosConfig);
      return await this.getResponseBody(response, options.response);
    }, options);
  }

  patch<T>(url: string, options: PostOptions<T>): Promise<T | null> {
    return this.runHandled(async () => {
      this.logger.log(`PATCH ${url}`);

      const axiosConfig: AxiosRequestConfig = await this.buildAxiosConfig(
        options,
      );
      let payload: any = options.request?.body || {};
      if (options.request?.validate) {
        await validateOrReject(payload);
      }
      if (options.request?.toPlainObject) {
        payload = instanceToPlain(payload);
      }
      const response = await axios.patch(url, payload, axiosConfig);
      return await this.getResponseBody(response, options.response);
    }, options);
  }

  private async getResponseBody<T>(
    data: any,
    options: ResponseOptions<T>,
  ): Promise<null | T> {
    let responseBody: null | T = null;
    if (options.mapper) {
      responseBody = options.mapper(data);
    }
    if (options.asyncMapper) {
      responseBody = await options.asyncMapper(data);
    }
    const items: T | T[] = data.items ?? data;
    if (options.bodyType) {
      if (data === '') {
        return null;
      }
      responseBody = plainToInstance(options.bodyType, items, {
        excludeExtraneousValues: true,
        exposeDefaultValues: true,
      });
    }
    if (responseBody !== null) {
      if (options.bodyType) {
        if (
          !Array.isArray(responseBody) &&
          !(responseBody instanceof options.bodyType)
        ) {
          throw ErrorFactory.validateType(options.bodyType, items);
        }
      }

      if (options.validateBody && isObject(responseBody)) {
        await validateOrReject(responseBody as object);
      }
    }
    return responseBody;
  }

  private async runHandled<T>(
    callback: () => Promise<T>,
    options?: ClientOptions,
  ): Promise<null | T> {
    try {
      return await callback();
    } catch (error) {
      this.logger.error(`Error while calling external api ${this.name}`, error);
      Observability.setTag('bobtail_external_api', this.name);
      if (!options?.nullOnFail) {
        throw this.asHttpException(error);
      }
      return null;
    }
  }

  private asHttpException(error: Error): HttpException {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        this.logger.error(
          `Method: ${error.config?.method} Url: ${error.config?.url} Message: Timeout exceeded`,
        );
        return new HttpException('Gateway Timeout', 504);
      }
      if (error.code === 'ECONNRESET') {
        this.logger.error(
          `Method: ${error.config?.method} Url: ${error.config?.url} Message: ${error.message}`,
        );
        return new HttpException(error.message, 502);
      }
      if (error.code === 'ETIMEDOUT') {
        this.logger.error(
          `Method: ${error.config?.method} Url: ${error.config?.url} Message: Connection timeout`,
        );
        return new HttpException('Request Timeout', 408);
      }

      if (error.response) {
        const errorMessage = error.response?.data?.message
          ? error.response.data.message
          : error.message;
        this.logger.error(
          `Method: ${error.config?.method} Url: ${error.config?.url} Message: ${errorMessage}`,
        );
        return new HttpException(errorMessage, error.response.status);
      }
    }
    if (error instanceof HttpException) {
      return error;
    }
    const errors = error instanceof ValidationError ? [error] : error;
    if (Array.isArray(errors)) {
      const constraints = errors
        .filter((e) => e instanceof ValidationError)
        .map((e) => (e as ValidationError).constraints || {})
        .map((e) => Object.values(e))
        .reduce((previous, current) => previous.concat(current), []);
      return new BadRequestException(constraints);
    }
    return this.somethingWentWrongException();
  }

  private somethingWentWrongException(): HttpException {
    return new HttpException('Something went wrong', 500);
  }

  private async buildHeaders(rawHeaders?: {
    [header: string]: AxiosHeaderValue;
  }): Promise<AxiosHeaders> {
    const headers = new AxiosHeaders(rawHeaders);
    const context = AppContextHolder.get();
    headers.set('x-correlation-id', context.correlationId);
    let token = await this.authTokenService.getAccessToken();
    if (token) {
      if (!token.startsWith('Bearer ')) {
        token = `Bearer ${token}`;
      }
      headers.setAuthorization(token);
    }
    headers.set('agent', context.agent);
    return headers;
  }

  private async buildAxiosConfig<T>(
    options?: PostOptions<T> | GetOptions<T> | DeleteOptions<T>,
  ): Promise<AxiosRequestConfig> {
    const headers = await this.buildHeaders(options?.request?.headers);
    const axiosConfig: AxiosRequestConfig = {
      headers,
      timeout: options?.timeout ?? axios.defaults.timeout, // default is 0
      data: options?.request?.body,
    };
    return axiosConfig;
  }
}
