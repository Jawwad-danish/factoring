import { Transform, TransformFnParams } from 'class-transformer';

/**
 * This transformer will get called when running plainToInstance
 * from class-transformer and will try to convert the value
 * to a boolean one
 *
 * For example this can be used when serializing the request body.
 */
export const TransformToBoolean = (): PropertyDecorator => {
  return Transform(
    (params: TransformFnParams) => {
      if (params.value == null) {
        return false;
      }
      if (typeof params.value === 'boolean') {
        return params.value;
      }
      if (
        typeof params.value === 'string' &&
        params.value.toLowerCase() === 'true'
      ) {
        return true;
      }
      return false;
    },
    { toClassOnly: true },
  );
};
