import { RequestContext } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';

const logger = new Logger('@Transactional()');

export function Transactional(name?: string): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const entityManager = RequestContext.getEntityManager();
      if (!entityManager) {
        logger.warn(
          `${target.constructor.name}#${propertyKey} is running outside of transaction because no request context entity manager was found`,
        );
        return originalMethod.apply(this, args);
      }
      if (entityManager.getContext().isInTransaction()) {
        logger.debug(
          `${target.constructor.name}#${propertyKey} is already running inside a transaction`,
        );
        return originalMethod.apply(this, args);
      }

      try {
        logger.debug(`Creating transaction for ${name}`);
        const result = await entityManager.transactional(() => {
          return originalMethod.apply(this, args);
        });
        return result;
      } finally {
        logger.debug(`Finished transaction for ${name}`);
      }
    };
  };
}
