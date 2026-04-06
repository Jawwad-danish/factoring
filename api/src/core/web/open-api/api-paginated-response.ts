import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string,
) => {
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: {
                    type: 'number',
                    description: 'Current page',
                  },
                  itemsPerPage: {
                    type: 'number',
                    description: 'Number of items per page',
                  },
                  totalItems: {
                    type: 'number',
                    description: 'Total items of the query',
                  },
                  totalPages: {
                    type: 'number',
                    description: 'Total pages of the query',
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
