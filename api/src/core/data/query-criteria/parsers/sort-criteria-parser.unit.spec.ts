import { ValidationError } from 'class-validator';
import { SortingOrder } from '../sort-criteria.model';
import { parseSortQuery } from './sort-criteria-parser';

describe('Sort query param parser', () => {
  it('When sort query param does not exist an empty array is returned', () => {
    expect(parseSortQuery({})).toStrictEqual([]);
  });

  it('When one sort query param exist one items is returned', () => {
    const criteria = parseSortQuery({
      sort: 'createdAt:ASC',
    });
    expect(criteria.length).toBe(1);
    expect(criteria[0].name).toBe('createdAt');
    expect(criteria[0].order).toBe(SortingOrder.ASC);
  });

  it('When multiple sort query param exist items are returned', () => {
    const criteria = parseSortQuery({
      sort: ['createdAt:ASC', 'updatedAt:DESC'],
    });
    expect(criteria.length).toBe(2);
    expect(criteria[0].name).toBe('createdAt');
    expect(criteria[0].order).toBe(SortingOrder.ASC);
    expect(criteria[1].name).toBe('updatedAt');
    expect(criteria[1].order).toBe(SortingOrder.DESC);
  });

  it('When one sort query param exist and invalid pattern exception is thrown', () => {
    expect(() => {
      parseSortQuery({
        sort: 'createdAtASC',
      });
    }).toThrow(ValidationError);
  });

  it('When multiple sort query param exist and invalid pattern exception is thrown', () => {
    expect(() => {
      parseSortQuery({
        sort: ['createdAt:ASC', 'updatedAtDESC'],
      });
    }).toThrow(ValidationError);
  });
});
