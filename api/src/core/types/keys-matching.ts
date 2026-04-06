/**
 * @template TargetType - the type from which properties are extracted
 * @template PropertyType - the type that the properties must have
 *
 * @description
 * Extracts all the properties of type PropertyType from type TargetType
 * and returns a new union type.
 *
 * [key in keyof TargetType] -> All the properties from type TargetType
 * TargetType[key] extends PropertyType ? key : never -> All the properties that extend PropertyType
 * can have the value of their own key or no value at all
 * [keyof TargetType] -> Index Access Types
 */
export type KeysMatching<TargetType, PropertyType> = {
  [key in keyof TargetType]: TargetType[key] extends PropertyType ? key : never;
}[keyof TargetType];

/**
 * @template TargetType - the type from which properties are extracted
 * @template PropertyType - the type that the properties must have
 * @template ExcludedProperties - the properties that are to be excluded
 *
 * @description
 * Extracts all the properties of type PropertyType from type TargetType,
 * exclude ExcludedProperties and returns a new union type.
 */

export type KeysMatchingExcept<
  TargetType,
  PropertyType,
  ExcludedProperties extends KeysMatching<TargetType, PropertyType>,
> = Exclude<KeysMatching<TargetType, PropertyType>, ExcludedProperties>;

export type KeysMatchingPick<
  TargetType,
  PropertyType,
  Keys extends KeysMatching<TargetType, PropertyType>,
> = Extract<KeysMatching<TargetType, PropertyType>, Keys>;
