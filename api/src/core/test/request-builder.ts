import { instanceToPlain } from 'class-transformer';

export abstract class RequestBuilder<T extends object> {
  protected request: T;

  constructor(data?: Partial<T>) {
    this.request = this.requestSupplier();
    Object.assign(this.request, data);
  }

  abstract requestSupplier(): T;

  getRequest(): T {
    return this.request;
  }

  getPayload() {
    return instanceToPlain(this.request);
  }
}

export const RequestBuilderMixin = <T extends object>(
  requestSupplier: () => T,
) => {
  class Builder {
    static from(data?: Partial<T>): T {
      const request = requestSupplier();
      Object.assign(request, data);
      return request;
    }

    static payload(data?: Partial<T>): any {
      return instanceToPlain(Builder.from(data));
    }
  }
  return Builder;
};
