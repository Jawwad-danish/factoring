import { TypedReadable } from '@core/streams';
import { QueryBuilder } from '@mikro-orm/postgresql';
import { Logger } from '@nestjs/common';

const logger = new Logger('database-stream');

export function createStreamWithErrorHandler<T, E extends object>(
  query: QueryBuilder<E>,
  methodName: string,
): TypedReadable<T> {
  const stream = query.getKnexQuery().stream();

  stream.on('error', (err) => {
    logger.error(
      `Database stream error in ${methodName}: ${err.message}`,
      err.stack,
    );

    stream.destroy(err);
  });

  return stream;
}
