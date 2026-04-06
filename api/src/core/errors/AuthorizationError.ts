export class AuthorizationError extends Error {
  constructor(readonly message: string) {
    super(message);
  }
}
