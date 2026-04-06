import { ClassConstructor, plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export const toClassAndValidate = async <T extends object, V>(
  klass: ClassConstructor<T>,
  plain: V,
) => {
  const result = plainToClass(klass, plain, {
    excludeExtraneousValues: true,
  });
  await validateOrReject(result);
  return result;
};
