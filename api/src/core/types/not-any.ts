// When T is any, 1 & T evalutes to any, and 0 extends any
// It will evaluate to true and the type will be never
// When T is something else, 1 & T evalutes to never, and 0 does not extend never
// It will evalute to false and the type will be T
export type NotAny<T> = 0 extends 1 & T ? never : T;
