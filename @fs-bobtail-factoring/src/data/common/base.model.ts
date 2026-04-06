export class BaseModel<T> {
  constructor(source?: Partial<T>) {
    if (source) {
      Object.assign(this, source);
    }
  }
}
