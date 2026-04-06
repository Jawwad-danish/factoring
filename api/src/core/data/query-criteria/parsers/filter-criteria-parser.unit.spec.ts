import { FilterOperator } from '../filter-criteria.model';
import { parseFilterQuery } from './filter-criteria-parser';

describe('Filter query param parser', () => {
  it('When filter query param does not exist an empty array is returned', () => {
    expect(parseFilterQuery({}, { parseFilterValues: false })).toStrictEqual(
      [],
    );
  });

  it('When one filter query param exist, a non-array item is returned', () => {
    const criteria = parseFilterQuery(
      {
        filter: 'id:$eq:[1]',
      },
      { parseFilterValues: false },
    );

    expect(criteria.length).toBe(1);
    expect(criteria[0].name).toBe('id');
    expect(criteria[0].operator).toBe(FilterOperator.EQ);
    expect(criteria[0].value).toStrictEqual('1');
  });

  it('When one filter query param exist and value parsing is enabled one items is returned', () => {
    const criteria = parseFilterQuery(
      {
        filter: 'id:$eq:[1]',
      },
      { parseFilterValues: true },
    );

    expect(criteria.length).toBe(1);
    expect(criteria[0].name).toBe('id');
    expect(criteria[0].operator).toBe(FilterOperator.EQ);
    expect(criteria[0].value).toStrictEqual(1);
  });

  it('When multiple filter query params exist, array of items is returned', () => {
    const criteria = parseFilterQuery(
      {
        filter: 'id:$in:[1,2,3]',
      },
      { parseFilterValues: true },
    );

    expect(criteria.length).toBe(1);
    expect(criteria[0].name).toBe('id');
    expect(criteria[0].operator).toBe(FilterOperator.IN);
    expect(criteria[0].value).toStrictEqual([1, 2, 3]);
  });

  it('When null operator for a filter exists, empty array is returned', () => {
    const criteria = parseFilterQuery(
      {
        filter: 'id:$notnull:[]',
      },
      { parseFilterValues: true },
    );

    expect(criteria.length).toBe(1);
    expect(criteria[0].name).toBe('id');
    expect(criteria[0].operator).toBe(FilterOperator.NOTNULL);
    expect(criteria[0].value).toStrictEqual([]);
  });
});
