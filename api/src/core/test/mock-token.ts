import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';

export const mockToken = (token: any): any => {
  if (typeof token === 'function') {
    return mockFunctionToken(token);
  }
};

// eslint-disable-next-line @typescript-eslint/ban-types
export const mockFunctionToken = (token: Function): any => {
  const moduleMocker = new ModuleMocker(global);
  const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<
    any,
    any
  >;
  const mock = moduleMocker.generateFromMetadata(mockMetadata);
  return new mock();
};
