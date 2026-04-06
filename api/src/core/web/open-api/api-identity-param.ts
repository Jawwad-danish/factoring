import { applyDecorators } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';

export const ApiIdentityParam = () => {
  return applyDecorators(
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
    }),
  );
};
