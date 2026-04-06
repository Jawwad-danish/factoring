export type Common<T1, T2> = Pick<T1 | T2, Extract<keyof T1, keyof T2>>;
