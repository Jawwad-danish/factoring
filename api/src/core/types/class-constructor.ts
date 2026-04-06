/**
 * @template T - the type that will be returned
 *
 * @description
 * Represents the constrctor of a class that can take arguments
 */
export declare type ClassConstructor<T> = {
  new (...args: any[]): T;
};

/**
 * @template T - the type that will be returned
 *
 * @description
 * Represents the empty constrctor of a class
 *
 */
export declare type EmptyClassConstructor<T> = {
  new (): T;
};

/**
 * @template T - the type of the partial object
 * @template K - required properties from type T
 *
 * @description
 * Generates builder methods for a certain class
 * with the specified properties as required
 */
export function partialBuilder<T extends object, K extends keyof T>(
  emptyClassConstructor: EmptyClassConstructor<T>,
) {
  return function wrapper(partial: Pick<T, K>) {
    const obj = new emptyClassConstructor();
    Object.assign(obj, partial);
    return obj;
  };
}
