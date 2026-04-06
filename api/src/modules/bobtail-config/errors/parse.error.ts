export class ParseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ParseError';
    if (cause instanceof Error) {
      this.stack = cause.stack;
    }
  }
}
