import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiQueryCriteria = () => {
  return applyDecorators(
    ApiQuery({
      name: 'filter',
      type: 'string',
      example: 'loadNumber:$in:[testLoad1,testLoad2];clientId:$eq:[id]',
      description:
        'Used for filtering. The pattern looks like <b>name:$operator:[value1,value2]</b>',
      required: false,
      examples: {
        'single value': {
          summary: 'Filter by one field and one value',
          value: 'loadNumber:$eq:[testLoad]',
          description:
            'Filter all by <b>loadNumber</b> that have the value to <u>testLoad</u>',
        },
        'multiple values': {
          summary: 'Filter by one field and multiple values',
          value: 'loadNumber:$in:[testLoad1, testLoad2]',
          description:
            'Filter all by <b>loadNumber</b> that have values equal to <u>testLoad1</u> or <u>testLoad2</u>',
        },
        'multiple fields': {
          summary: 'Filter by one multiple fields',
          value: 'loadNumber:$eq:[testLoad];clientId:$eq:[id]',
          description:
            'Filter all by <b>loadNumber</b> with value <u>testLoad</u> and <b>clientId</b> with value <u>id</u>',
        },
      },
    }),
    ApiQuery({
      name: 'sort',
      type: 'string',
      description: 'Used for sorting. The pattern looks like <b>name:order<b>',
      required: false,
      examples: {
        'ascending order': {
          summary: 'Ascending order',
          value: 'loadNumber:ASC',
          description: 'Sort by loadNumber in ascending order',
        },
        'descending order': {
          summary: 'Descending order',
          value: 'loadNumber:DESC',
          description: 'Sort by loadNumber in descending order',
        },
      },
    }),
    ApiQuery({
      name: 'page',
      type: 'number',
      description:
        'Used for pagination. Represents the page from where we want to show results',
      required: false,
      example: '1',
    }),
    ApiQuery({
      name: 'limit',
      type: 'number',
      description:
        'Used for pagination. Represents the number of items we want to show per page',
      required: false,
      example: '10',
    }),
  );
};
