import { FilterOperator } from './filter-criteria.model';
import { PageCriteria } from './page-criteria.model';
import {
  serializeQueryCriteria,
  serializeQueryCriteriaForTransfersService,
} from './query-criteria.serializer';
import { SortingOrder } from './sort-criteria.model';

describe('Query criteria serializer', () => {
  it('should return an empty string when query is undefined', () => {
    expect(serializeQueryCriteria()).toBe('');
  });

  it('should return an empty string when query is an empty object', () => {
    expect(serializeQueryCriteria({})).toBe('');
  });

  it('should serialize sort criteria correctly', () => {
    const query = {
      sort: [
        { name: 'name', order: SortingOrder.ASC },
        { name: 'age', order: SortingOrder.DESC },
      ],
    };
    expect(serializeQueryCriteria(query)).toBe('sort=name:ASC&sort=age:DESC');
  });

  it('should serialize filter criteria with single value correctly', () => {
    const query = {
      filters: [
        { name: 'status', operator: FilterOperator.EQ, value: 'active' },
      ],
    };
    expect(serializeQueryCriteria(query)).toBe('filter=status:$eq:[active]');
  });

  it('should serialize filter criteria with multiple values correctly', () => {
    const query = {
      filters: [
        {
          name: 'status',
          operator: FilterOperator.IN,
          value: ['active', 'inactive'],
        },
      ],
    };
    expect(serializeQueryCriteria(query)).toBe(
      'filter=status:$in:[active,inactive]',
    );
  });

  it('should serialize pagination correctly', () => {
    const query = {
      page: new PageCriteria({ page: 2, limit: 10 }),
    };
    expect(serializeQueryCriteria(query)).toBe('page=2&limit=10');
  });

  it('should serialize a combination of sort, filter, and pagination correctly', () => {
    const query = {
      sort: [{ name: 'name', order: SortingOrder.ASC }],
      filters: [
        { name: 'status', operator: FilterOperator.EQ, value: 'active' },
      ],
      page: new PageCriteria({ page: 1, limit: 10 }),
    };
    expect(serializeQueryCriteria(query)).toBe(
      'sort=name:ASC&filter=status:$eq:[active]&page=1&limit=10',
    );
  });

  it('should handle empty sort, filter, and page arrays correctly', () => {
    const query = {
      sort: [],
      filters: [],
      page: undefined,
    };
    expect(serializeQueryCriteria(query)).toBe('');
  });
});

describe('Query criteria serializer for transfers service', () => {
  it('should return an empty string when query is undefined', () => {
    expect(serializeQueryCriteriaForTransfersService()).toBe('');
  });

  it('should serialize filter criteria correctly', () => {
    const query = {
      filters: [
        { name: 'status', operator: FilterOperator.EQ, value: 'active' },
      ],
    };
    expect(serializeQueryCriteriaForTransfersService(query)).toBe(
      'status=active',
    );
  });

  it('should serialize logical operators correctly', () => {
    const query = {
      filters: [
        {
          name: 'createdAt',
          operator: FilterOperator.LTE,
          value: '2021-01-01',
        },
        {
          name: 'createdAt',
          operator: FilterOperator.GTE,
          value: '2020-01-01',
        },
      ],
    };
    expect(serializeQueryCriteriaForTransfersService(query)).toBe(
      'createdAt[before]=2021-01-01&createdAt[after]=2020-01-01',
    );
  });

  it('should serialize filter criteria and limit correctly', () => {
    const query = {
      filters: [
        { name: 'status', operator: FilterOperator.EQ, value: 'active' },
      ],
      page: new PageCriteria({ page: 1, limit: 10 }),
    };
    expect(serializeQueryCriteriaForTransfersService(query)).toBe(
      'status=active&limit=10',
    );
  });
});
