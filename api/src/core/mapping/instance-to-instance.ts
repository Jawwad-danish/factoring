import {
  ClassConstructor,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';

type Options = {
  ignoreExposeExclude?: boolean;
};

export const instanceToPlainToInstance = <T>(
  cls: ClassConstructor<T>,
  object: any,
  options: Options = { ignoreExposeExclude: true },
): T => {
  const plain = instanceToPlain(object, {
    ignoreDecorators: options.ignoreExposeExclude,
  });
  return plainToInstance(cls, plain, {
    ignoreDecorators: options.ignoreExposeExclude,
  });
};
