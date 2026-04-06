import { Transform, TransformFnParams } from 'class-transformer';

export const TransformToString = (): PropertyDecorator => {
  return Transform(
    (params: TransformFnParams) => {
      if (params.value == null) {
        return null;
      }
      return String(params.value);
    },
    { toPlainOnly: true, toClassOnly: true },
  );
};
