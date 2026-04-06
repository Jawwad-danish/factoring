/**
 * @template UnionType - type with all possible values
 * @template PropertyType - type to be assign for properties
 *
 * @description
 * Builds a new type with all the properties from UnionType as
 * optional and each property with type PropertyType.
 *
 * @example
 * type Person = AllOptional<'firstName' | 'lastName' | 'email', string>;
 * const p: Person = { firstName: 'John', lastName: 'Doe' };
 */
export type AllOptional<UnionType extends string, PropertyType> = {
  [key in UnionType]+?: PropertyType;
};
