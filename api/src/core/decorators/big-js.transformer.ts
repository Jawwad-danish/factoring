import Big from 'big.js';
import { Transform, TransformFnParams } from 'class-transformer';

export interface TransformFromBigOptions {
  decimals: number;
}

/**
 * This transformer will get called when running plainToInstance
 * from class-transformer and will convert any parameters that
 * the Big constructor accepts into Big instances.
 *
 * For example this can be used when serializing the request body.
 */
export const TransformToBig = (): PropertyDecorator => {
  return Transform(
    (params: TransformFnParams) => {
      if (params.value == null) {
        return null;
      }
      // Needed in case we receive non numeric characters
      try {
        return new Big(params.value);
      } catch (error) {
        return null;
      }
    },
    { toClassOnly: true },
  );
};
/**
 * This transformer will get called when running instanceToPlain
 * from class-transformer and will convert Big instances into strings.
 *
 * Every property will get transformed into a 'primitive' type
 * and Big instances will get transformed into a plain JS object if
 * this transformer is not used.
 *
 * For example this can be used when deserializing the response object.
 **/
export const TransformFromBig = (
  options?: TransformFromBigOptions,
): PropertyDecorator => {
  return Transform(
    (params: TransformFnParams) => {
      if (params.value === undefined) {
        return undefined;
      }
      if (params.value === null) {
        return null;
      }
      return convertBigToString(params.value as Big, options);
    },
    { toPlainOnly: true },
  );
};

/**
 * This transformer will get called when running instanceToPlain
 * from class-transformer and will convert methods that return Big instances into strings.
 *
 * Every property will get transformed into a 'primitive' type
 * and Big instances will get transformed into a plain JS object if
 * this transformer is not used.
 *
 * For example this can be used when deserializing the response object.
 **/
export const TransformGetterFromBig = (): PropertyDecorator => {
  return Transform(
    (params: TransformFnParams) => {
      if (params.value == null) {
        return null;
      }
      return convertBigToString(params.value.apply(params.obj) as Big);
    },
    { toPlainOnly: true },
  );
};

const convertBigToString = (
  value: Big,
  options?: TransformFromBigOptions,
): string => {
  return value.toFixed(options?.decimals);
};
