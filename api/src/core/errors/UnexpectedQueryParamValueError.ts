export class UnexpectedQueryParamValueError extends Error {
  constructor(
    readonly property: string,
    readonly value: unknown,
    readonly message: string,
  ) {
    super(`Unexpected value for ${value} on property ${property}. ${message}`);
  }
}
