export interface MessagePayload<T = any> {
  id: string;
  data: T;
}
