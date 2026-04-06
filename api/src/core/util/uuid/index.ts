export class UUID {
  static get() {
    return crypto.randomUUID();
  }
}
