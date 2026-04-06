export enum Reason {
  Validation = 'Validation',
  ExternalServiceCall = 'ExternalServiceCall',
  Missing = 'Missing',
  Unknown = 'Unknown',
}

export class CauseAwareError extends Error {
  constructor(
    readonly id: string,
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message);
  }

  getReason(): Reason {
    if (this.cause && this.cause instanceof CauseAwareError) {
      return this.cause.getReason();
    }
    return Reason.Unknown;
  }

  skipObservability(): boolean {
    return false;
  }
}
